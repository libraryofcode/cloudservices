package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/go-redis/redis/v7"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"io/ioutil"
	"time"
)

// Collection the MongoDB Account collection
var Collection *mongo.Collection

// RedisClient the Redis client
var RedisClient *redis.Client

// Account represents an user's account.
type Account struct {
	Username     string    `json:"username"`
	UserID       string    `json:"userID"`
	EmailAddress string    `json:"emailAddress"`
	CreatedBy    string    `json:"createdBy"`
	CreatedAt    time.Time `json:"createdAt"`
	Locked       bool      `json:"locked"`
}

// HandleError This function panics if an error exists.
func HandleError(e error, serv int) {
	if e != nil && serv == 1 {
		panic(e)
	} else if e != nil && serv == 0 {
		fmt.Println(e)
	}
}

func main() {
	type Config struct {
		MongoDB string `json:"mongoURL"`
	}
	config := &Config{}
	file, err := ioutil.ReadFile("../config.json")
	HandleError(err, 1)
	err = json.Unmarshal(file, &config)

	client, err := mongo.NewClient(options.Client().ApplyURI(config.MongoDB))
	HandleError(err, 1)
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(ctx)
	HandleError(err, 1)
  err = client.Ping(context.TODO(), nil)
  fmt.Printf("Connected to MongoDB [GO]\n")
	HandleError(err, 1)

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

  _, err = RedisClient.Ping().Result()
  fmt.Printf("Connected to Redis [GO]\n")
	HandleError(err, 1)

	for {
    handler()
    fmt.Printf("Calling handler func [GO]\n")
    time.Sleep(1000000 * time.Second)
  }
}

func handler() {
	cur, err := Collection.Find(context.TODO(), bson.M{})
	HandleError(err, 0)

	for cur.Next(context.TODO()) {
    go checkAccountSizeAndUpdate(cur.Current.Lookup("username").String(), cur.Current.Lookup("id").String())
    fmt.Printf("Checking account information for %s\n", cur.Current.Lookup("username").String())
		time.Sleep(600000 * time.Second)
	}
}

func checkAccountSizeAndUpdate(username string, id string) {
  var bytes float64 = 0
  sizeHome := DirSize("/home/" + username)
  bytes += sizeHome
  sizeMail := DirSize("/var/mail/" + username)
  bytes += sizeMail
  RedisClient.Set("storage"+"-"+id, bytes, 0)
  fmt.Printf("Set Call | Username: %v, ID: %v | Bytes: %f\n", username, id, bytes)
}
