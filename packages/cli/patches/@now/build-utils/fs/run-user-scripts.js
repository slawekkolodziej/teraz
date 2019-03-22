--- run-user-scripts.js	2019-03-22 18:25:37.000000000 +0100
+++ my-run-user-scripts.js	2019-03-22 18:33:34.000000000 +0100
@@ -73,7 +73,11 @@
     await spawnAsync('npm', ['install'].concat(commandArgs), destPath);
     await spawnAsync('npm', ['cache', 'clean', '--force'], destPath);
   } else {
-    await spawnAsync('yarn', ['--cwd', destPath].concat(commandArgs), destPath);
+    await spawnAsync('yarn', [
+      '--cwd', destPath,
+      '--cache-folder', '.yarn-cache',
+      '--silent'
+    ].concat(commandArgs), destPath);
     await spawnAsync('yarn', ['cache', 'clean'], destPath);
   }
 }
