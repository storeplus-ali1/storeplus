import os, re
p = 'android/app/build.gradle'
t = open(p).read()
n = os.environ['RUN_NO']
t, c1 = re.subn(r'versionCode\s+\d+', 'versionCode ' + n, t, 1)
t, c2 = re.subn(r'versionName\s+"[^"]*"', 'versionName "1.' + n + '"', t, 1)
sc = '''
    signingConfigs {
        release {
            storeFile file("customer.keystore")
            storePassword System.getenv("KS_PASS")
            keyAlias "storeplus"
            keyPassword System.getenv("KS_PASS")
        }
    }
    buildTypes {'''
t, c3 = re.subn(r'\n\s*buildTypes\s*\{', sc, t, 1)
i = t.index('buildTypes {')
head, tail = t[:i], t[i:]
tail, c4 = re.subn(r'(\n\s*release\s*\{)', r'\1\n            signingConfig signingConfigs.release', tail, 1)
t = head + tail
print('versionCode', c1, 'versionName', c2, 'signingConfigs', c3, 'release', c4)
assert c1 and c3 and c4
open(p, 'w').write(t)
