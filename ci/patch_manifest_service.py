m = 'android/app/src/main/AndroidManifest.xml'
t = open(m).read()
if 'xmlns:tools' not in t:
    t = t.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ', 1)
svc = ('<service android:name="com.capacitorjs.plugins.pushnotifications.MessagingService" tools:node="remove"/>'
       '<service android:name="com.storeplus.app.SpMessagingService" android:exported="false"><intent-filter android:priority="100"><action android:name="com.google.firebase.MESSAGING_EVENT"/></intent-filter></service>')
assert '</application>' in t
t = t.replace('</application>', svc + '</application>', 1)
open(m, 'w').write(t)
print('service patched')
g = 'android/app/build.gradle'
b = open(g).read()
if 'firebase-messaging' not in b:
    b = b.replace('dependencies {', "dependencies {\n    implementation 'com.google.firebase:firebase-messaging:23.3.1'", 1)
    open(g, 'w').write(b)
print('firebase-messaging dep added')
