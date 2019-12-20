package main

import (
	"os"
	"path/filepath"
)

// DirSize This function returns the total size of a directory in bytes.
func DirSize(path* string) float64 {
	var dirSize int64 = 0

	readSize := func(path string, file os.FileInfo, err error) error {
		if !file.IsDir() {
			dirSize += file.Size()
		}

		return nil
	}

	err := filepath.Walk(*path, readSize)
	HandleError(err, 0)

	size := float64(dirSize)

	return size
}
