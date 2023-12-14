/**
 * @type {import('@farmfe/core').UserConfig}
 */
export default {
  compilation: {
    // script: {
    //   target: 'es2022',
    // },
    // presetEnv: {
    //   options: {
    //     targets: 'last 1 versions',
    //   },
    // },
    input: {
      index: './src/index.html',
    },
  },
  server: {
    proxy: {
      '/completion': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
};
