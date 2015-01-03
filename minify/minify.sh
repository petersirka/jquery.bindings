ECHO "[COMPILING]"
cd ..
uglifyjs jquery.bindings.js -c -m -o jquery.bindings.min.js
cd minify
node minify.js ../jquery.bindings.min.js