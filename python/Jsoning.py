import ujson
from os import stat

class Jsoning:
    def __init__(self, pathname = "data.json", dataDefault={}):
        self.pathname = pathname
        self.dataDefault = ujson.dumps(dataDefault) 
        
        if not self.exists():
            self._default_()
            return self.write()
        
        try:
            self.data = self.read()
        except Exception:
            self.write()
            
    def _default_(self):
        self.data = ujson.loads(self.dataDefault)
    
    def exists(self):
        try:
            stat(self.pathname)
            return True
        except OSError:
            return False
        
    def read(self):
        with open(self.pathname, "r") as file:
            return ujson.load(file)

    def write(self):
        with open(self.pathname, "w") as archivo:
            ujson.dump(self.data, archivo)
            
if __name__ == "__main__":
    
    jsoning = Jsoning('config.json', {})
    
    