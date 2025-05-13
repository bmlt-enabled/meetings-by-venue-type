#!/usr/bin/env perl

use warnings;
use strict;
use LWP::UserAgent;
use HTTP::Request;
use JSON qw( decode_json );
use Term::ANSIColor qw(:constants);

$SIG{__WARN__} = sub {
    my $warning = shift;
    warn $warning unless $warning =~ /Subroutine .* redefined at/;
};

print BRIGHT_WHITE,   "\nGet Meetings By Venue-Type \n", RESET;
print BRIGHT_MAGENTA, "\nRoot Servers: \n",              RESET;

my $RootServersData = get_url(
    'https://raw.githubusercontent.com/bmlt-enabled/aggregator/main/rootServerList.json'
);

my @RootServers = ();
@RootServers = sort { $a->{name} cmp $b->{name} } @$RootServersData;

my $rc = 1;
foreach my $server (@RootServers) {
    print BRIGHT_YELLOW, "  $rc $server->{name}\n", RESET;
    $rc++;
}

print BRIGHT_MAGENTA, "\nSelect a root server: ", RESET;
my $RootServerInput = <STDIN>;
chomp $RootServerInput;
my $RootLength = @RootServers;
if ( $RootServerInput > $RootLength ) {
    print BRIGHT_RED,
        "\nError: Selection ($RootServerInput) must match one of the choices.",
        RESET;
    exit;
}

my $RootServerName = $RootServers[ $RootServerInput - 1 ]->{name};
my $RootServerUrl  = $RootServers[ $RootServerInput - 1 ]->{rootURL};
print BRIGHT_MAGENTA, "\nYou selected: ", RESET, BRIGHT_RED,
    "$RootServerInput [$RootServerName]\n", RESET;

print BRIGHT_MAGENTA, "\nRegions: \n", RESET;
my $ServiceBodyData = get_url("$RootServerUrl/client_interface/json/?switcher=GetServiceBodies");

my @ServiceBodiesSort = sort { $a->{name} cmp $b->{name} } @$ServiceBodyData;

my %regions = ();
my $sbrc    = 1;
foreach my $ServiceBodyRegion (@ServiceBodiesSort) {
    if ( $ServiceBodyRegion->{type} eq "RS" ) {
        $regions{$sbrc} = $ServiceBodyRegion;
        print BRIGHT_YELLOW, "  $sbrc $ServiceBodyRegion->{name}\n", RESET;
        $sbrc++;
    }
}

my @RegionsSort = sort { $a->{name} cmp $b->{name} } values %regions;
print BRIGHT_MAGENTA, "\nSelect a region: ", RESET;
my $RegionInput = <STDIN>;
chomp $RegionInput;
if ( $RegionInput > ( values %regions ) ) {
    print BRIGHT_RED,
        "\nError: Selection ($RegionInput) must match one of the choices.", RESET;
    exit;
}
my $RegionName = $RegionsSort[ $RegionInput - 1 ]->{name};
my $RegionID   = $RegionsSort[ $RegionInput - 1 ]->{id};
print BRIGHT_MAGENTA, "\nYou selected: ", RESET, BRIGHT_RED,
    "$RegionInput [$RegionName ($RegionID)]\n", RESET;

my %ServiceBodies = ();
my $sbc           = 1;
print BRIGHT_MAGENTA, "\nService Bodies: \n", RESET;
foreach my $ServiceBody (@ServiceBodiesSort) {
    if (   $ServiceBody->{id} eq $RegionID
        || $ServiceBody->{parent_id} eq $RegionID )
    {
        $ServiceBodies{$sbc} = $ServiceBody;
        print BRIGHT_YELLOW, "  $sbc $ServiceBody->{name}\n", RESET;
        $sbc++;
    }
}

my @ServiceBodySort = sort { $a->{name} cmp $b->{name} } values %ServiceBodies;
print BRIGHT_MAGENTA, "\nSelect a service body: ", RESET;
my $ServiceBodyInput = <STDIN>;
chomp $ServiceBodyInput;
if ( $ServiceBodyInput > ( values %ServiceBodies ) ) {
    print BRIGHT_RED,
        "\nError: Selection ($ServiceBodyInput) must match one of the choices.",
        RESET;
    exit;
}
my $ServiceBodyName = $ServiceBodySort[ $ServiceBodyInput - 1 ]->{name};
my $ServiceBodyID   = $ServiceBodySort[ $ServiceBodyInput - 1 ]->{id};
print BRIGHT_MAGENTA, "\nYou selected: ", RESET, BRIGHT_RED,
    "$ServiceBodyInput [$ServiceBodyName ($ServiceBodyID)]\n", RESET;

print BRIGHT_WHITE, "\nTotal Meetings By Venue Type\n", RESET;
print BRIGHT_BLUE, "\n", "-=" x 20, "\n", RESET;

my $MeetingsData = get_url(
    "$RootServerUrl/client_interface/json/?switcher=GetSearchResults&services=$ServiceBodyID&recursive=1&data_field_key=formats"
);

my $InPerson = my $hybrid = my $virtual = my $TempVirtual = my $total = 0;

foreach my $meeting (@$MeetingsData) {
    my %formats = map { $_ => 1 } split( ',', $meeting->{formats} );
    $total++;
    if (   !exists( $formats{VM} )
        && !exists( $formats{TC} )
        && !exists( $formats{HY} ) )
    {
        $InPerson++;
    }
    elsif (exists( $formats{VM} )
        && !exists( $formats{TC} )
        && !exists( $formats{HY} ) )
    {
        $virtual++;
    }
    elsif (exists( $formats{VM} )
        && exists( $formats{TC} )
        && !exists( $formats{HY} ) )
    {
        $TempVirtual++;
        $virtual++;
    }
    elsif (!exists( $formats{VM} )
        && !exists( $formats{TC} )
        && exists( $formats{HY} ) )
    {
        $hybrid++;
    }
    elsif (exists( $formats{VM} )
        && !exists( $formats{TC} )
        && exists( $formats{HY} ) )
    {
        $hybrid++;
    }
}

print BRIGHT_CYAN,  "\nIn-person: ", RESET, BRIGHT_GREEN, "$InPerson",   RESET;
print BRIGHT_CYAN,  "\nHybrid: ",    RESET, BRIGHT_GREEN, "$hybrid",     RESET;
print BRIGHT_CYAN,  "\nVirtual: ",   RESET, BRIGHT_GREEN, "$virtual",    RESET;
print BRIGHT_WHITE, "\nTotal Meetings: ", RESET, BRIGHT_GREEN, "$total", RESET;
print BRIGHT_BLUE,  "\n\n",               "-=" x 20, "\n\n", RESET;

sub get_url {
    my $url    = $_[0];
    my $ua     = LWP::UserAgent->new( ssl_opts => { verify_hostname => 1 } );
    my $header = HTTP::Request->new(
        GET => $url,
        [
            'User-Agent' =>
                'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) +bmltperl'
        ]
    );
    my $request  = HTTP::Request->new( 'GET', $url, $header );
    my $response = $ua->request($request);
    return decode_json( $response->decoded_content );
}
