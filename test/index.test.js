const assert = require("assert");

const csrf = require("../");
const axios = require("axios").default;
const runServer = require("./utils/server");
const Koa = require("koa");

describe("koa-csrf-header", () => {
  let server;
  describe("Test server", () => {
    before(async () => {
      const app = new Koa();
      app.use(ctx => {
        ctx.body = "hello";
      });
      server = await runServer(app);
    });
    it("Should run the server", async () => {
      assert(server);
    });
    it("Should send 200 http", async () => {
      const answer = await axios.get("http://localhost:3333");
      assert.deepEqual(answer.status, 200);
      assert.deepEqual(answer.data, "hello");
    });
    after(() => {
      server.close();
    });
  });
  describe("CSRF middleware default behavior", () => {
    const CSRFTokenCookieName = "csrf-token";
    before(async () => {
      const app = new Koa();
      app.use(
        csrf({
          getToken: ctx => ctx.cookies.get(CSRFTokenCookieName),
          setToken: (token, ctx) => {
            ctx.cookies.set(CSRFTokenCookieName, token, { httpOnly: false });
          }
        })
      );
      app.use(ctx => {
        ctx.body = "hello";
      });
      server = await runServer(app);
    });
    it("Should have a 'set-cookie' header as a CSRF token", async () => {
      const response = await axios.get("http://localhost:3333");
      const headerRegEx = new RegExp(`${CSRFTokenCookieName}=.*;.path=/`);
      assert(headerRegEx.test(response.headers["set-cookie"][0]));
    });
    it("Should accept GET request without CSRF token", async () => {
      const response = await axios.get("http://localhost:3333");
      assert.deepEqual(response.status, 200);
      assert.deepEqual(response.data, "hello");
    });
    it("Should accept HEAD request without CSRF token", async () => {
      const response = await axios.head("http://localhost:3333");
      assert.deepEqual(response.status, 200);
    });
    it("Should accept OPTIONS request without CSRF token", async () => {
      const response = await axios.options("http://localhost:3333");
      assert.deepEqual(response.status, 200);
    });
    it("Should reject POST request without CSRF token", async () => {
      try {
        await axios.post("http://localhost:3333");
      } catch (error) {
        assert.deepEqual(error.response.status, 403);
        assert.deepEqual(error.response.data, "Invalid CSRF Token");
      }
    });
    it("Should reject PATCH request without CSRF token", async () => {
      try {
        await axios.patch("http://localhost:3333");
      } catch (error) {
        assert.deepEqual(error.response.status, 403);
        assert.deepEqual(error.response.data, "Invalid CSRF Token");
      }
    });
    it("Should reject DELETE request without CSRF token", async () => {
      try {
        await axios.delete("http://localhost:3333");
      } catch (error) {
        assert.deepEqual(error.response.status, 403);
        assert.deepEqual(error.response.data, "Invalid CSRF Token");
      }
    });
    // it("Should accept POST request without CSRF token", async () => {
    //   try {
    //     const response = await axios.get("http://localhost:3333");
    //     const CSRFTokenHeader = response.headers["set-cookie"][0];
    //     const CSRFTokenHeaderArray = CSRFTokenHeader.split(";")[0];
    //     const token = CSRFTokenHeaderArray.split("=")[1];
    //     await axios.post(
    //       "http://localhost:3333",
    //       {},
    //       {
    //         headers: {
    //           [CSRFTokenCookieName]: token,
    //           Cookie: `${CSRFTokenCookieName}=${token};`
    //         }
    //       }
    //     );
    //   } catch (error) {
    //     console.log(error.response);
    //     // assert.deepEqual(error.response.status, 403);
    //     // assert.deepEqual(error.response.data, "Invalid CSRF Token");
    //   }
    // });
    after(() => {
      server.close();
    });
  });
  describe("CSRF defence", () => {
    before(async () => {
      const app = new Koa();
      app.use(
        csrf({
          getToken: ctx => ctx.cookies.get("csrf-token"),
          setToken: (token, ctx) => {
            ctx.cookies.set("csrf-token", token, { httpOnly: false });
          }
        })
      );
      app.use(ctx => {
        ctx.body = "hello";
      });
      server = await runServer(app);
    });
    it("Should accept POST request when CSRF header and cookie matches", async () => {
      const getRes = await axios.get("http://localhost:3333");
      const CSRFTokenHeader = getRes.headers["set-cookie"][0];
      const CSRFTokenHeaderCookie = CSRFTokenHeader.split(";")[0];
      const token = CSRFTokenHeaderCookie.split("=")[1];
      const postRes = await axios.post(
        "http://localhost:3333",
        {},
        {
          headers: {
            "X-CSRF-Token": token,
            Cookie: CSRFTokenHeaderCookie
          }
        }
      );
      assert.deepEqual(postRes.status, 200);
    });
    it("Should accept PATCH request when CSRF header and cookie matches", async () => {
      const getRes = await axios.get("http://localhost:3333");
      const CSRFTokenHeader = getRes.headers["set-cookie"][0];
      const CSRFTokenHeaderCookie = CSRFTokenHeader.split(";")[0];
      const token = CSRFTokenHeaderCookie.split("=")[1];
      const postRes = await axios.patch(
        "http://localhost:3333",
        {},
        {
          headers: {
            "X-CSRF-Token": token,
            Cookie: CSRFTokenHeaderCookie
          }
        }
      );
      assert.deepEqual(postRes.status, 200);
    });
    it("Should accept DELETE request when CSRF header and cookie matches", async () => {
      const getRes = await axios.get("http://localhost:3333");
      const CSRFTokenHeader = getRes.headers["set-cookie"][0];
      const CSRFTokenHeaderCookie = CSRFTokenHeader.split(";")[0];
      const token = CSRFTokenHeaderCookie.split("=")[1];
      const postRes = await axios.delete("http://localhost:3333", {
        headers: {
          "X-CSRF-Token": token,
          Cookie: CSRFTokenHeaderCookie
        }
      });
      assert.deepEqual(postRes.status, 200);
    });
    after(() => {
      server.close();
    });
  });
});
