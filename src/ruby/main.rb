#!/usr/bin/env ruby
# frozen_string_literal: true

# main.rb
require 'uri'
require 'net/http'
require 'json'

# Used for console colors
class String
  def red
    "\e[31m\e[1m#{self}\e[0m"
  end

  def green
    "\e[32m\e[1m#{self}\e[0m"
  end

  def blue
    "\e[34m\e[1m#{self}\e[0m"
  end

  def magenta
    "\e[35m\e[1m#{self}\e[0m"
  end

  def cyan
    "\e[36m\e[1m#{self}\e[0m"
  end

  def white
    "\e[38m\e[1m#{self}\e[0m"
  end

  def yellow
    "\e[93m\e[1m#{self}\e[0m"
  end
end

def get_url(url)
  useragent = 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) +bmltruby'
  get = Net::HTTP.get_response(URI(url), { 'User-Agent' => useragent })
  JSON.parse(get.body)
end

def pretty
  print "\n"
  print '-='.blue.to_s * 20
  print "\n\n"
end

# rubocop:disable Metrics/MethodLength
# rubocop:disable Metrics/PerceivedComplexity
# rubocop:disable  Metrics/AbcSize
# rubocop:disable Metrics/CyclomaticComplexity
def populate
  # rubocop:enable Metrics/MethodLength
  # rubocop:enable Metrics/PerceivedComplexity
  # rubocop:enable  Metrics/AbcSize
  # rubocop:enable Metrics/CyclomaticComplexity
  puts "\nGet Meetings By Venue-Type".white
  puts "\nRoot Servers:".magenta

  root_servers_data = get_url(
    'https://raw.githubusercontent.com/bmlt-enabled/aggregator/main/serverList.json'
  ).sort_by { |k| k['name'] }

  rsc = 1
  root_servers_data.each do |i|
    puts "  #{rsc} #{i['name']}".yellow
    rsc += 1
  end

  print "\nSelect a root server: ".magenta
  rs_input = gets.chomp

  if rs_input.to_i > root_servers_data.length
    print "\nError: Selection (#{rs_input}) must match one of the choices.".red
    exit(1)
  end

  rs_name = root_servers_data[rs_input.to_i - 1]['name']
  rs_url = root_servers_data[rs_input.to_i - 1]['url']

  puts "\n#{'You selected: '.magenta}\033[1;31m#{rs_input} [#{rs_name}]\e[0m"
  puts "\nRegions:".magenta

  service_body_data = get_url(
    "#{rs_url}client_interface/json/?switcher=GetServiceBodies"
  ).sort_by { |k| k['name'] }

  regions = []
  sbrc = 1
  service_body_data.each do |i|
    next unless i['type'] == 'RS'

    puts "  #{sbrc} #{i['name']}".yellow
    regions.push i
    sbrc += 1
  end

  print "\nSelect a region: ".magenta
  rg_input = gets.chomp

  if rg_input.to_i > regions.length
    print "\nError: Selection (#{rg_input}) must match one of the choices.".red
    exit(1)
  end

  rg_name = regions[rg_input.to_i - 1]['name']
  rg_id = regions[rg_input.to_i - 1]['id']

  # noinspection RubyInterpreter
  puts "\n#{'You selected: '.magenta}\033[1;31m#{rg_input} [#{rg_name} (#{rg_id})]\e[0m"
  puts "\nService Bodies:".magenta

  service_bodies = []
  sbc = 1
  service_body_data.each do |i|
    next unless i['id'] == rg_id || i['parent_id'] == rg_id

    puts "  #{sbc} #{i['name']}".yellow
    service_bodies.push i
    sbc += 1
  end

  print "\nSelect a service body: ".magenta
  sb_input = gets.chomp

  if sb_input.to_i > service_bodies.length
    print "\nError: Selection (#{sb_input}) must match one of the choices.".red
    exit(1)
  end

  sb_name = service_bodies[sb_input.to_i - 1]['name']
  sb_id = service_bodies[sb_input.to_i - 1]['id']

  puts "\n#{'You selected: '.magenta}\033[1;31m#{sb_input} [#{sb_name} (#{sb_id})]\e[0m"

  meetings_data = get_url(
    "#{rs_url}client_interface/json/?switcher=GetSearchResults&services=#{sb_id}&recursive=1&data_field_key=formats"
  )

  in_person = virtual = hybrid = temp_virtual = temp_closed = total = 0
  meetings_data.each do |i|
    formats = i['formats'].split(',')
    if (!formats.include? 'VM') && (!formats.include? 'TC') && (!formats.include? 'HY')
      in_person += 1
    elsif (formats.include? 'VM') && (!formats.include? 'TC') && (!formats.include? 'HY')
      virtual += 1
    elsif (formats.include? 'VM') && (formats.include? 'TC') && (!formats.include? 'HY')
      virtual += 1
      temp_virtual += 1
    elsif (!formats.include? 'VM') && (!formats.include? 'TC') && (formats.include? 'HY')
      hybrid += 1
    elsif (formats.include? 'VM') && (!formats.include? 'TC') && (formats.include? 'HY')
      hybrid += 1
    elsif (!formats.include? 'VM') && (formats.include? 'TC') && (!formats.include? 'HY')
      temp_closed += 1
    end
    total += 1
  end

  {
    "in_person": in_person,
    "virtual": virtual,
    "temp_virtual": temp_virtual,
    "temp_closed": temp_closed,
    "hybrid": hybrid,
    "total": total
  }
end

def print_totals(totals)
  puts "\nTotal Meetings By Venue Type".white
  pretty
  puts "#{'In-person: '.cyan}\e[32m\e[1m#{totals[:in_person]}\e[0m"
  puts "#{'Hybrid: '.cyan}\e[32m\e[1m#{totals[:hybrid]}\e[0m"
  puts "#{'Virtual: '.cyan}\e[32m\e[1m#{totals[:virtual]}\e[0m"
  puts "#{'Total Meetings: '.white}\e[32m\e[1m#{totals[:total]}\e[0m"
  pretty
end

def main
  t = populate
  print_totals(t)
end

main
