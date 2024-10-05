const http = require("http");
const url = require("url");
const querystring = require("querystring");
const mysql = require("mysql2/promise"); // 使用promise版本
const bcrypt = require("bcrypt");
const dbConfig = require("./.env.local.js");

// 创建MySQL连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, // 禁用SSL证书验证
  },
});

// 发送JSON响应的辅助函数
function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头以允许跨域
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 解析URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 收集请求体
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    const postData = querystring.parse(body);

    try {
      switch (pathname) {
        case "/user/login":
          if (req.method === "POST") {
            const { username, password } = postData;

            // 查询数据库
            const [rows] = await pool.execute(
              "SELECT * FROM users WHERE username = ?",
              [username]
            );
            if (rows.length > 0) {
              const user = rows[0];
              const isPasswordValid = await bcrypt.compare(
                password,
                user.password
              );
              if (isPasswordValid) {
                sendJsonResponse(res, 200, { message: "Login successful" });
              } else {
                sendJsonResponse(res, 401, { message: "Invalid credentials" });
              }
            } else {
              sendJsonResponse(res, 401, { message: "Invalid credentials" });
            }
          } else {
            res.writeHead(405, { Allow: "POST" });
            res.end("Method Not Allowed");
          }
          break;
        case "/user/registry":
          if (req.method === "POST") {
            const { username, password } = postData;

            // 生成哈希密码
            const hashedPassword = await bcrypt.hash(password, 10); // 10是盐轮数

            // 插入到数据库
            try {
              const [result] = await pool.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                [username, hashedPassword]
              );
              if (result.affectedRows > 0) {
                sendJsonResponse(res, 201, {
                  message: "User registered successfully",
                });
              } else {
                sendJsonResponse(res, 500, {
                  message: "Internal Server Error",
                });
              }
            } catch (err) {
              if (err.code === "ER_DUP_ENTRY") {
                sendJsonResponse(res, 409, { message: "User already exists" });
              } else {
                sendJsonResponse(res, 500, {
                  message: "Internal Server Error",
                });
              }
            }
          } else {
            res.writeHead(405, { Allow: "POST" });
            res.end("Method Not Allowed");
          }
          break;
        default:
          res.writeHead(404);
          res.end("Not Found");
      }
    } catch (err) {
      console.error(err);
      sendJsonResponse(res, 500, { message: "Internal Server Error" });
    }
  });
});

// 监听所有网络接口上的3000端口
server.listen(3000, "0.0.0.0", () => {
  console.log("Server is listening on port 3000...");
});
