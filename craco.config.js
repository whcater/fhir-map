module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "timers": require.resolve("timers-browserify"),
          "stream": require.resolve("stream-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "buffer": require.resolve("buffer/"),
          "util": require.resolve("util/")
        }
      }
    }
  }
}; 