FROM debian:stable-slim
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

EXPOSE 3550
CMD ["./out/build/x64-release-linux/sqfilms", "--path", "/data/reviews.db"]
