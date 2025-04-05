// Define the type for the JSONP callback
type JsonpCallback = (data: any) => void;

// Extend the Window interface to include our dynamic callback
declare interface CustomWindow extends Window {
  [key: string]: JsonpCallback;
}
