const logger = require('../../config/logger');

// const userLogin = (userData)=>{
//   return new Promise((resolve,reject)=>{
//     var qry = `select * from user where ? and ?`;
//     var condition1 = {userName:userData.userName};
//     var condition2 = {password:userData.password};
//     db.query(qry,[condition1,condition2],(err,result)=>{
//       if (err) {
//         dbFunc.connectionRelease;
//         logger.debug(err);
//         reject(err);
//       }
//       else{
//         logger.debug(result[0]);
//         if(result.length>0){
//           resolve("login successfull");
//         }
//         else{
//           resolve({"success":false,  "message":"email not exist"});
//         }
//       }
//     });
//   });
// }


// module.exports = {userLogin};