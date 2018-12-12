'''
Created on Dec 3, 2018

@author: dpavlyuk
'''
#!/usr/bin/python3
from http.server import BaseHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse, urlencode, quote_plus, parse_qs
from socketserver import ThreadingMixIn
import threading
import os.path



#from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer
from os import curdir, sep
import cgi
from collections import defaultdict

PORT_NUMBER = 8087

#This class will handles any incoming request from
#the browser 
class myHandler(BaseHTTPRequestHandler):
    
    
    def setup(self):
        super(myHandler, self).setup()
        self.file_lock = defaultdict(lambda: threading.Lock())
        
    
    def file_mutex(self, filename):
        print("Lock file: "+filename)
        return self.file_lock[filename]
    
    #Handler for the GET requests
    def do_GET(self):
        self.url = urlparse(self.path)
        if self.path=="/":
            self.path="/index.html"
            
        if self.path.startswith("/api"):
            self.handle_api()
            return

        try:
            #Check the file extension required and
            #set the right mime type

            sendReply = False
            if self.path.endswith(".html"):
                mimetype='text/html'
                sendReply = True
            if self.path.endswith(".jpg"):
                mimetype='image/jpg'
                sendReply = True
            if self.path.endswith(".gif"):
                mimetype='image/gif'
                sendReply = True
            if self.path.endswith(".js"):
                mimetype='application/javascript'
                sendReply = True
            if self.path.endswith(".css"):
                mimetype='text/css'
                sendReply = True

            if sendReply == True:
                #Open the static file requested and send it
                f = open(curdir + sep + self.path, 'rb') 
                self.send_response(200)
                self.send_header('Content-type',mimetype)
                self.end_headers()
                self.wfile.write(f.read())
                f.close()
            return

        except IOError:
            self.send_error(404,'File Not Found: %s' % self.path)

    #Handler for the POST requests
    def do_POST(self):
        self.url = urlparse(self.path)
        if self.path.startswith("/api"):
            self.handle_api()
            return          
    
    def send_error(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', "text/plain")
        self.end_headers()
        self.wfile.write("{}: {}".format(code, message).encode())
        
    def handle_api(self):
        qs = parse_qs(self.url.query)
        print("handle api" + str(qs))
        try:
            action = qs["action"][-1]
            filename=""
            
            if (action in ["get", "get_size", "log", "truncate"]):
                filename=qs["file"][-1]
                storage_dir=os.path.realpath(os.path.join(curdir, "storage"))
                filepath = os.path.realpath(os.path.join(storage_dir, filename))
    
                
                if not filepath.startswith(storage_dir):
                    self.send_error(403, "forbidden to access: {}".format(filename))
                    return
                if not action in ("log",):
                    if (not os.path.exists(filepath)):
                        self.send_error(404, "file not found: {}".format(filename))
                        return
                    
                mutex = self.file_mutex(filepath)


            if action=="get":
                self.send_response(200)
                self.send_header('Content-type', "text/plain")
                self.end_headers()
                with open(filepath, 'rb') as f:
                    if "offset" in qs:
                        f.seek(int(qs["offset"][-1]))
                    if "length" in qs:
                        self.wfile.write(f.read(int(qs["length"][-1])))
                        self.wfile.write(f.readline())
                    else:
                        self.wfile.write(f.read())
            elif action=="get_size":
                self.send_response(200)
                self.send_header('Content-type', "text/plain")
                self.end_headers()
                self.wfile.write(str(os.path.getsize(filepath)).encode())
            elif action=="truncate":
                self.send_response(200)
                self.send_header('Content-type', "text/plain")
                self.end_headers()
                with mutex:
                    open(filepath, 'w').close()
            elif action=="log":
                content_len = int(self.headers.get('content-length', 0))
                content=self.rfile.read(content_len)
                print(content_len)
                with mutex:
                    with open(filepath, "ab") as f:
                        f.write(content)
                self.send_response(200)
                self.send_header('Content-type', "text/plain")
                self.end_headers()

        except (IndexError, KeyError) as e:
            self.send_response(500)
            self.send_header('Content-type', "text/plain")
            self.end_headers()
            self.wfile.write("500 - internal error".encode())
        
        #self.wfile.write(str(parse_qs(self.url.query)).encode())
        #print(parse_qs(self.path));

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in a separate thread."""

try:
    #Create a web server and define the handler to manage the
    #incoming request
    server = HTTPServer(('', PORT_NUMBER), myHandler)
    print('Started httpserver on port ' , PORT_NUMBER)
    
    #Wait forever for incoming htto requests
    server.serve_forever()

except KeyboardInterrupt:
    print('^C received, shutting down the web server')
    server.socket.close()
    