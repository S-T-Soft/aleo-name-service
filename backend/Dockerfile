# stage 1
FROM rust:1.71 as builder

WORKDIR /usr/src/ans_api

COPY . .

RUN cargo install --path .

# stage 2
FROM debian:bullseye-slim

# install libssl-dev and ca-certificates
RUN apt-get update && apt-get install -y libssl-dev ca-certificates libcurl4

# clean the cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# copy the build artifact from the build stage
COPY --from=builder /usr/local/cargo/bin/ans-api /usr/local/bin/ans-api

CMD ["ans-api"]
