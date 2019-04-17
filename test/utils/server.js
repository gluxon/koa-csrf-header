const http = require("http");

const runServer = async app => {
  try {
    const server = http.createServer(app.callback()).listen(3333);
    return server;
  } catch (err) {
    console.error(`Can not start MML server: ${err}`);
    return err;
  }
};
module.exports = runServer;
