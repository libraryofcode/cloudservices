package main

import (
	"fmt"
	"encoding/json"
	"crypto/tls"
	"os"
)

// ReturnValue the struct for what the JSON should return
type ReturnValue struct {
	Ok bool `json:"ok"`
	Message string `json:"message"`
}

func main() {
	_, err := tls.LoadX509KeyPair(os.Args[1], os.Args[2])
	if err != nil && err.Error() == "tls: private key does not match public key" {
		json, _ := json.Marshal(&ReturnValue{Ok: false, Message: "PUBLIC KEY DOES NOT MATCH PRIVATE KEY"})
		fmt.Printf("%s", string(json))
		return
	} else if err != nil {
		panic(err)
	} else {
		json, _ := json.Marshal(&ReturnValue{Ok: true, Message: "PUBLIC KEY MATCHES PRIVATE KEY"})
		fmt.Printf("%s", string(json))
	}
}