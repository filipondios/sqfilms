FROM debian:stable-slim AS builder
RUN apt-get update && apt-get install -y \
    cmake \
    ninja-build \
    git \
    clang \
    && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/filipondios/sqfilms.git
ARG REPO_BRANCH=main

WORKDIR /app
RUN git clone --branch ${REPO_BRANCH} ${REPO_URL} . && \
    git submodule update --init --recursive

RUN cmake --preset x64-release-linux && \
    cmake --build --preset x64-release-linux

FROM debian:stable-slim
COPY --from=builder /app/out/build/x64-release-linux/sqfilms /usr/local/bin/sqfilms

EXPOSE 3550
CMD ["sqfilms", "--path", "/data/reviews.db"]
