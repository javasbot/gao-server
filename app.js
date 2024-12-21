const http = require("http");
const url = require("url");
const mysql = require("mysql2/promise"); // 使用promise版本
const crypto = require("crypto");
const dbConfig = require("./.env.local.js");
const jwt = require("jsonwebtoken");
const handleWrite = require("./user/write");
const handlePost = require("./user/post");
const handlePostDetail = require("./user/postDetail");

// 创建MySQL连接池，并禁用SSL验证
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

// 生成随机盐
function generateSalt() {
  return crypto.randomBytes(32).toString("hex");
}

// 哈希密码
async function hashPassword(password, salt) {
  const iterations = 10000; // 迭代次数
  const keylen = 64; // 密钥长度
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keylen,
      "sha256",
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString("hex"));
      }
    );
  });
}

// 验证密码
async function verifyPassword(hashedPassword, password, salt) {
  const iterations = 10000; // 迭代次数
  const keylen = 64; // 密钥长度
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keylen,
      "sha256",
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString("hex"));
      }
    );
  });
  return hashedPassword === derivedKey;
}

// JWT 密钥
const JWT_SECRET = "#Gao_$gei";

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头以允许跨域
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求token
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
    try {
      const postData = JSON.parse(body); // 解析JSON格式的请求体
      switch (pathname) {
        case "/user/login":
          if (req.method === "POST") {
            const { username, password } = postData;

            // 确保 username 和 password 都不为 undefined
            if (!username || !password) {
              return sendJsonResponse(res, 400, {
                message: "Username and password are required",
              });
            }

            // 查询数据库
            const [rows] = await pool.execute(
              "SELECT * FROM users WHERE username = ?",
              [username]
            );
            if (rows.length > 0) {
              const user = rows[0];
              const isPasswordValid = await verifyPassword(
                user.password,
                password,
                user.salt
              );
              if (isPasswordValid) {
                // 生成 JWT
                const token = jwt.sign(
                  { id: user.id, username: user.username },
                  JWT_SECRET,
                  { expiresIn: "1h" }
                );
                sendJsonResponse(res, 200, {
                  username,
                  message: "Login successful",
                  token,
                });
              } else {
                sendJsonResponse(res, 401, { message: "账号密码不一致" });
              }
            } else {
              sendJsonResponse(res, 401, { message: "用户不存在" });
            }
          } else {
            res.writeHead(405, { Allow: "POST" });
            res.end("Method Not Allowed");
          }
          break;
        case "/user/register":
          if (req.method === "POST") {
            const { username, email, password } = postData;
            // 确保 username、email 和 password 都不为 undefined
            if (!username || !email || !password) {
              return sendJsonResponse(res, 400, {
                message: "Username, email, and password are required",
              });
            }

            // 生成盐
            const salt = generateSalt();

            // 生成哈希密码
            const hashedPassword = await hashPassword(password, salt);

            // 插入到数据库
            try {
              const [result] = await pool.execute(
                "INSERT INTO users (username, email, password, salt) VALUES (?, ?, ?, ?)",
                [username, email, hashedPassword, salt]
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
                console.error(err);
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
        case "/user/write":
          if (req.method === "POST") {
            await handleWrite(req, res, postData); // 传递postData给handleWrite
          } else {
            res.writeHead(405, { Allow: "POST" });
            res.end("Method Not Allowed");
          }
          break;
        case "/user/postDetail":
          if (req.method === "POST") {
            await handlePostDetail(req, res, postData); // 传递postData给handlePost
          } else {
            res.writeHead(405, { Allow: "POST" });
            res.end("Method Not Allowed");
          }
          break;
        case "/user/posts":
          if (req.method === "POST") {
            await handlePost(req, res, postData); // 传递postData给handlePost
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
