# grpcwebtext-decoder

This package is originally forked from [grpcwebtext-parser](https://github.com/floydjones1/grpcwebtext-parser) and improved by also parsing trailing gRPC headers (i.e. grpc-status and grpc-message).

A simple script that parses grpc-web-text and converts it to a more human friendly form.

## What you need to run this?

```
node
protoc
```

Please install protoc either through chocolately (Windows) or brew (Mac).

## How to use?

```
npx grpcwebtext-decoder [insert grpc text]
```
