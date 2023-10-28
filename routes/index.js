var express = require('express');
var router = express.Router();
const { pool } = require('../database');
router.use(express.json());
const jwt = require('jsonwebtoken');
/* GET home page. */
router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the login page' });
});

router.get('/classroom', (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the classroom page' });
});

router.post('/api/user/login', async (req, res) => {
  let { username, password } = req.body;
  console.log({ username, password });
  try {
      const results = await pool.query(
          `SELECT * FROM users
          WHERE username = $1`, [username]
      );

      if (results.rows.length === 0) {
          console.log("User not registered");
          res.status(200).json({ success: false, message: "User not registered" });
      } else {
          const storedPassword = results.rows[0].password;

          if (password === storedPassword) {
              console.log("Login success");
              
            const user = { name  : username }
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
            console.log({accessToken,refreshToken})
              res.status(200).json({ success: true, message: "Login successful", data:{
                username:username,
                role:results.rows[0].role,
                first_name:results.rows[0].first_name,
                last_name:results.rows[0].last_name,
                token:{
                    access: accessToken,
                    refresh: refreshToken
                }
              }});
          } else {
              console.log("Wrong Password");
              res.status(200).json({ success: false, message: "Wrong Password" });
          }
      }
  } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "An error occurred" });
  }
});

router.post('/api/classrooms', async (req, res) => {
  const { username } = req.body;
  console.log(username);
  try {
      // Find the user's ID by username
      const userQuery = await pool.query(
          'SELECT user_id FROM users WHERE username = $1',
          [username]
      );
      const userId = userQuery.rows[0].user_id;

      // Find the enrolled classrooms for the user
      const enrollmentsQuery = await pool.query(
          `SELECT c.classroom_name, u.first_name AS teachername, e.classroom_id
          FROM Enrollment AS e
          INNER JOIN Classrooms AS c ON e.classroom_id = c.classroom_id
          INNER JOIN Users AS u ON c.teacher_id = u.user_id
          WHERE e.student_id = $1`,
          [userId]
      );

      const classrooms = enrollmentsQuery.rows;

      if (classrooms.length === 0) {
          // If the user has not enrolled in any classrooms, return an appropriate message
          return res.status(200).json({ success: false, message: 'No classrooms enrolled' });
      }

      res.status(200).json({ success: true, classrooms });
  } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.post('/api/classrooms/task', async (req, res) => {
  const { classroom_id } = req.body;
  console.log(classroom_id);
  try {
      // Find the enrolled classrooms for the user
      const tasksQuery = await pool.query(
          'SELECT  assignment_id, assignment_name, description, due_date FROM assignments  ' +
          'WHERE  classroom_id = $1',
          [classroom_id]
      );

      const tasks = tasksQuery.rows;

      if (tasks.length === 0) {
          // If the user has not enrolled in any classrooms, return an appropriate message
          return res.status(200).json({ success: false, message: 'No classrooms enrolled' });
      }

      res.status(200).json({ success: true, tasks });
  } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred' });
  }
});



module.exports = router;
