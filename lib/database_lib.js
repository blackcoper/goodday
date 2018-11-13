var db_config = require('../config/database');
var DatabaseError = require('custom-errors').general.DatabaseError;
//var parent= require('../index');

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Code = require('mongodb').Code,
    //BSON = require('mongodb').pure().BSON,
    mongoose = require('mongoose');
 

module.exports = function(parent){
	//console.log('parent',parent);
	if (typeof parent === 'boolean'){		
		  var express = require('express');
		  parent = express();
		  if(mongoose.connection.readyState == 0){
	      	url_auth = '';
	      	if(db_config.database[parent.get('env')].username !='' && db_config.database[parent.get('env')].password !=''){
	      		url_auth = db_config.database[parent.get('env')].username+':'+db_config.database[parent.get('env')].password+'@';
	      	}
			mongoose.connect('mongodb://'+url_auth+db_config.database[parent.get('env')].host+':'+db_config.database[parent.get('env')].port+'/'+db_config.database[parent.get('env')].name,function(err){
	           	if (err) {
	           	 	
	           		throw new Error(err);
	           	 	// return next(new DatabaseError(((typeof(err) == 'undefined')? 'Could Not Connect To Database': err))); 
	          	}
	          	console.log('connected to mongodb port '+db_config.database[parent.get('env')].port);
			});
	      }
	      
	      return this;
	}
    
	parent.use(function(req,res,next){
		 /* Db.connect('mongodb://'+db_config.database[parent.get('env')].username+':'+db_config.database[parent.get('env')].password+'@'+db_config.database[parent.get('env')].host+':'+db_config.database[parent.get('env')].port+'/'+db_config.database[parent.get('env')].name,function(err,db){
	           console.log('current envinronment is :'+parent.get('env'));
	         
	           if (err)
	           {
				   console.log(err.errmsg);
	              return next(new DatabaseError(((typeof(err.errmsg) == 'undefined')? 'Could Not Connect To Database': err.errmsg))); 
	           }
	           db.close();
	           //mongo_connection =  mongoose.createConnection('mongodb://'+db_config.database[parent.get('env')].username+':'+db_config.database[parent.get('env')].password+'@'+db_config.database[parent.get('env')].host+':'+db_config.database[parent.get('env')].port+'/'+db_config.database[parent.get('env')].name);
	           //this.mongoConnection = mongo_connection;
	           //mongoose.connect('mongodb://'+db_config.database[parent.get('env')].username+':'+db_config.database[parent.get('env')].password+'@'+db_config.database[parent.get('env')].host+':'+db_config.database[parent.get('env')].port+'/'+db_config.database[parent.get('env')].name,function(err){
	          // 	 if (err) {
	           	 	
	           //	 	 return next(new DatabaseError(((typeof(err.errmsg) == 'undefined')? 'Could Not Connect To Database': err.errmsg))); 
	           	 	
	           //	 }
   
	           	
	           });
	           console.log('success connect to database');
	           next();
	      });*/
	     console.log('state',mongoose.connection.readyState);
	     if(mongoose.connection.readyState == 0)
	     {
		      mongoose.connect('mongodb://'+db_config.database[parent.get('env')].username+':'+db_config.database[parent.get('env')].password+'@'+db_config.database[parent.get('env')].host+':'+db_config.database[parent.get('env')].port+'/'+db_config.database[parent.get('env')].name,function(err){
		           	 if (err) {
		           	 	 //mongoose.connection.close();
		           	 	 return next(new DatabaseError(((typeof(err) == 'undefined')? 'Could Not Connect To Database': err))); 
	
		          	 }
		          	 mongoose.connection.close();
		          	 console.log('success connect to database');
		           	 next();
		      });
	     }
	     else
	     {
	     	next();
	     }
     });
     
	this.closeConnection = function(){
		if(mongoose.connection.readyState != 0){
			return  mongoose.connection.close();
		}
	}
}