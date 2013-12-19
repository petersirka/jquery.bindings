ECHO "[COMPILING]"
cd ..
uglifyjs jquery.bindings.js -o jquery.bindings.min.js
cd minify
node minify.js ../jquery.bindings.min.js