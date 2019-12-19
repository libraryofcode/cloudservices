echo "Library of Code sp-us | Cloud Services"
echo "TypeScript & Go"
echo "Building TS files"
yarn run build
echo "Building Go files"
go build -o dist/intervals/storage src/intervals/storage.go src/intervals/dirsize.go