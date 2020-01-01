# This file builds the Go binaries. Hardcoded by LOC Engineering
CGO_ENABLED=0 go build -o ./dist/bin/storage ./src/go/storage/storage.go ./src/go/storage/dirsize.go
file dist/bin/storage
CGO_ENABLED=0 go build -o ./dist/bin/checkCertificate ./src/go/checkCertificate/checkCertificate.go
file dist/bin/checkCertificate
CGO_ENABLED=0 go build -o ./dist/bin/checkCertSignatures ./src/go/checkCertSignatures/checkCertSignatures.go
file /dist/bin/checkCertSignatures
