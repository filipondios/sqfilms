FROM rust:slim AS builder
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/filipondios/sqfilms.git
ARG REPO_BRANCH=v1.0.0

WORKDIR /app
RUN git clone --branch ${REPO_BRANCH} ${REPO_URL} .

RUN cargo build --release
FROM debian:stable-slim
COPY --from=builder /app/target/release/sqfilms /usr/local/bin/sqfilms
COPY --from=builder /app/static /static
COPY --from=builder /app/templates /templates

WORKDIR /
EXPOSE 8000
ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_PORT=8000
CMD ["sqfilms", "--path", "/data/reviews.db"]
