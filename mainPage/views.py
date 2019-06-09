from django.shortcuts import render
import json
import os
from django.template.response import TemplateResponse

# Create your views here.
def main(request):
    #date = request.GET['date']
    dir = os.path.dirname(os.path.abspath(__file__))
    files = [file for file in os.listdir(dir+'\Downloads') if file.endswith('.txt')]
    toJsonArr={}
    for file in files:
        f = open(dir+'/Downloads/'+file, 'r')
        js=json.load(f)
        f.close()
        #print(js['eff'], js['eff'].keys())
		
        try:
            #if date in js['eff']:
            toJsonArr[js['code']] = {'name':js['name'], 'coords':js['coords'], 'eff':js['eff']}
        except Exception as e:
            print("error in ", file, e)	
    res = json.dumps(toJsonArr)
    #print(res)
    return TemplateResponse(request, "imos.html", {'stations':res})