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
  "strings"
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

  Collection = client.Database("cloudservices").Collection("accounts")

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

  _, err = RedisClient.Ping().Result()
  fmt.Printf("Connected to Redis [GO]\n")
	HandleError(err, 1)

	for {
		fmt.Printf("Calling handler func [GO]\n")
    handler()
    time.Sleep(1000000 * time.Millisecond)
  }
}

func handler() {
	cur, err := Collection.Find(context.TODO(), bson.D{})
	HandleError(err, 0)

	for cur.Next(context.TODO()) {
    go checkAccountSizeAndUpdate(cur.Current.Lookup("username").String(), cur.Current.Lookup("id").String())
    fmt.Printf("Checking account information for %s\n", cur.Current.Lookup("username").String())
		time.Sleep(600000 * time.Millisecond)
	}
}

func checkAccountSizeAndUpdate(username string, id string) {
  var size float64 = 0
  var userHomeDirectory string = strings.Replace(strings.Join([]string{"/home/", string(username)}, ""), "\"", "", -1)
  fmt.Println(userHomeDirectory)
  sizeHome := DirSize(&userHomeDirectory)
  size += sizeHome
  sizeMail := DirSize(&userHomeDirectory)
  size += sizeMail
  RedisClient.Set("storage"+"-"+string(id), size, 0)
  fmt.Printf("Set Call | Username: %v, ID: %v | Bytes: %f\n", string(username), string(id), size)
}
