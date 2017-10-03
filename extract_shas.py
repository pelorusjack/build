import re
import sys
from sys import argv
import ruamel.yaml as yaml



regexes = [
    ".*aarch64-linux-gnu.tar.gz",
    ".*i686-pc-linux-gnu.tar.gz",
    ".*x86_64-linux-gnu.tar.gz",
    ".*arm-linux-gnueabihf.tar.gz",
    ".*win32.zip",
    ".*win64.zip",
    ".*osx64.tar.gz"
    ]

combined = "(" + ")|(".join(regexes) + ")"

files = [
    "blocknetdx-linux-2.3-res.yml",
    "blocknetdx-osx-2.3-res.yml",
    "blocknetdx-win-2.3-res.yml"
]

outstring = "|File|Checksum (SHA256)|\n"
outstring += "|----|------|\n"

for file in files:
    with open("result/" + file) as stream:
        try:
            doc = yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            print(exc)

        stream = doc.items()[0][1]
        lines = stream.split('\n')
        for line in lines:
            if re.match(combined, line):
                details = line.split()
                outstring += "|" + details[1] + "|" + details[0] + "|\n"

print(outstring)    
