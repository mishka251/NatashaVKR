#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jul  9 10:01:28 2018

@author: AndreiVorobev(cpu16bit)
"""
import pandas as pd
import numpy as np
import os
from typing import Dict
#from datetime import date
import json
import zipfile
import gzip

class StationData:
    """
    Класс данных о станции
    Name - название станции
    Code - IAGA CODE
    Latitude, Longitude - координаты станции
    Efficienty - эффектиновть(0-100) для дня
    """
    Name:str=""
    Code:str=""
    Latitude:float=0.0
    Longitude:float=0.0
    Efficience:Dict[str, float]={}

    def __init__(self, name:str, code:str, latitude:float, longitude:float):
        self.Latitude=latitude
        self.Longitude = longitude
        self.Code=code
        self.Name=name
        self.Efficience={}

    def addEfficienceDay(self, day:str, val:float):
        self.Efficience[day]=val

    def toDict(self):
        return {'name':self.Name, 'code':self.Code, 'coords':{'lat':self.Latitude, 'long':self.Longitude}, 'eff':self.Efficience}

    def saveToFile(self, fileName=""):
        """
        Сохранение данных в файл
        В случае отсутствия имени файла именем будет код станции
        """
        if fileName=="":
            fileName=self.Code+".txt"
        f = open(fileName, 'w')
        json.dump(self.toDict(), f)
        f.close()

Stations:Dict[str, StationData] = {} 

# ЭКСПОРТ ДАННЫХ ИЗ ФОРМАТА IAGA-2002 в DataFrame И СОХРАНЕНИЕ РЕЗУЛЬТАТА В *.txt
def IAGA2002(path:str,
             time_aver='1min',
             maxTime=1440,
             delNaN=False, 
             lineinter=False,
             XorH_interpolate=False,
             YorD_interpolate=False,
             Z_interpolate=False,
             ForG_interpolate=False):  # Функция декодирования и анализа одного файла данных обсерватории

    if path.endswith('.gz'):
        file = gzip.open(path, 'rt')#, newline='\n')
    else:
        file = open(path)
    content = file.readlines()  # Преобразуем считанный файл в массив данных (1 строка = 1 элемент массива)
    file.close()
   # if path.endswith('.gz'):
    #    print(content)
    skipRows = 0
    stringTest = ''
    name=""
    code=""
    longitude=0.0
    latitude=0.0
    day = "1970-1-1"#date(1970, 1, 1)
    while stringTest[0:4] != 'DATE':
        
        arr = stringTest.strip().split(" ")
        lineCont = list(filter(lambda s: len(s)>0, arr) )


        if len(lineCont)>0 and lineCont[0]=="Station":
            name = " ".join(lineCont[2:len(lineCont)-1])#название станции - Station Name из начала и "|" из конца

        if len(lineCont)>0 and lineCont[0]=="IAGA":
            code = lineCont[2]#название станции - Station Name из начала и "|" из конца

        if len(lineCont)>1 and lineCont[0]=="Geodetic":

            if lineCont[1]=="Latitude":
                latitude=float(lineCont[2])

            if lineCont[1]=="Longitude":
                longitude=float(lineCont[2])


        stringTest = str(content[skipRows])
        
        skipRows += 1
    df = pd.read_csv(path, skiprows=skipRows - 1, skipinitialspace=True, delim_whitespace=1)
    df.drop(df.columns[-1], axis=1, inplace=True)


    dateStr = df[df.columns[0]][0]
    #[yearN, monthN, dayN] = list(map(int, dateStr.split("-")))
    day = dateStr#date(yearN, monthN, dayN)


    #print(day)
    df['DATETIME'] = df[df.columns[0]] + ' ' + df[df.columns[1]]

    cnames = [df.columns[7], df.columns[2], df.columns[3], df.columns[4], df.columns[5],
              df.columns[6]]  # Вытаскиваем имена столбцов: 'DATETIME','DOY','XorH','YorD','Z','ForG']

    for i in range(2, 6):
        df = df.rename(columns={df.columns[i + 1]: cnames[i]})  # Переименовываем столбцы в XorH, YorD , Z и ForG
    df = df[cnames]  # Упорядочиваем столбцы
    #

    df['DATETIME'] = pd.to_datetime(df['DATETIME'])  #
    for i in range(1, 6):  # Форматируем
        pd.to_numeric(df[df.columns[i]])  #

    df = df.set_index('DATETIME')  #
    df = df.resample(time_aver).mean()  # Прореживание временного ряда
    df = df.reset_index()  #

    for i in range(2, 6):
        df[df.columns[i]][df[df.columns[i]] >= 88888] = np.nan  # Заменяем 99999 на NaN

    if (delNaN == True):  #
        df = df.dropna(axis=0, how='any')  # Удаляем битые значения (NaN)
        df = df.reset_index()  #

    if (XorH_interpolate == True):  # Интерполяция пропущенных значений
        df[cnames[2]] = df[cnames[2]].interpolate(method='linear',
                                                  axis=0).ffill().bfill()  # Восстановление пропусков линейной регрессией
    if (YorD_interpolate == True):  #
        df[cnames[3]] = df[cnames[3]].interpolate(method='linear',
                                                  axis=0).ffill().bfill()  # Восстановление пропусков линейной регрессией
    if (Z_interpolate == True):  #
        df[cnames[4]] = df[cnames[4]].interpolate(method='linear',
                                                  axis=0).ffill().bfill()  # Восстановление пропусков линейной регрессией
    if (ForG_interpolate == True):  #
        df[cnames[5]] = df[cnames[5]].interpolate(method='linear',
                                                  axis=0).ffill().bfill()  # Восстановление пропусков линейной регрессией

    arrNaN = []
    for i in range(2, 6):
        arrNaN.append(df[cnames[i]].isnull().values.sum())

    eff = round((100 - np.mean(arrNaN) / maxTime * 100), 3)


    for i in range(2, 6):
        df[df.columns[i]] = round(df[df.columns[i]], 2)
		
    #Sif eff!=100:
        #print('ne 100', path, eff)
    #print(day)
    return {'eff':eff, 'name':name, 'code':code, 'lat':latitude, 'long':longitude, 'date':day }


def loadIAGAforDate(dirPath:str='data/'):

    fileName = os.listdir(dirPath)  #

    fileName.sort()
    if fileName[0] != '.DS_Store':  #
        startNum = 0  # Проверка списка файлов обсерваторий на скрытый файл .DS_Store
    else:  #
       startNum = 1


    for k in range(startNum, len(fileName)):
        try:
            #print(list(map(lambda sit: Stations[sit].toDict(), Stations)))
            result = IAGA2002(dirPath + '\\' + fileName[k])

            if not result['code'] in Stations:
                Stations[result['code']] = StationData(result['name'], result['code'], result['lat'], result['long'])

            #print(result['code'], Stations[result['code']].toDict())
            Stations[result['code']].addEfficienceDay(result['date'], result['eff'])
            #print(result['eff'])
        except Exception as e:
            print("error in "+fileName[k], e)
        #print(list(map(lambda sit: Stations[sit].toDict(), Stations)))
        pass
    pass


def loadForAllDays(rootPath:str):
    dateDirs = [f.path for f in os.scandir(rootPath) if f.is_dir() ] 
    for dir in dateDirs:
        #print(dir)
        files = os.listdir(dir)
        zips = [file for file in files if file.endswith('.zip')]
        for zip in zips:
            #print(dir+'\\'+zip)
            archive = zipfile.ZipFile(dir+'\\'+zip)
            archive.extractall(dir)
            archive.close()
            os.remove(dir+'\\'+zip)
        #print(files)
        loadIAGAforDate(dir)
        pass
    pass

if __name__=="__main__":
    curDir = os.getcwd()
    loadForAllDays(curDir)

    for key in Stations:
        Stations[key].saveToFile()

    print("ok")
    pass
