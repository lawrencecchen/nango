#!/bin/bash

# This script adds .ts extensions to all relative import paths in TypeScript files within the specified directory.

# Directory to process
DIR="lib"

# Find all TypeScript files in the specified directory
find "$DIR" -type f -name "*.ts" | while read -r file; do
    # Process each TypeScript file
    sed -i 's|\(from\s\+["'"'"']\)\(\.\./\|\.\/\)\([^"'"'"']*\)\(["'"'"']\)|\1\2\3.ts\4|g' "$file"
done
