# This file builds the Go binaries. Hardcoded by LOC Engineering
go build -o dist/bin/storage src/go/storage/storage.go src/go/storage/dirsize.go
file dist/bin/storage
go build -o dist/bin/checkCertificate src/go/checkCertificate/checkCertificate.go
file dist/bin/checkCertificate

