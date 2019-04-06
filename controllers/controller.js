// Node Dependencies
var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request'); // for web-scraping
var cheerio = require('cheerio'); // for web-scraping

// Import the Comment and Article models
var Comment = require('../models/Comment.js');
var Article = require('../models/Article.js');

// Index Page Render (first visit to the site)
router.get('/', function (req, res){

  // Scrape data
  res.redirect('/scrape');

});



router.get('/articles', function (req, res){

  Article.find().sort({_date: -1})

    .populate('comments')

    .exec(function(err, doc){

      if (err){
        console.log(err);
      } 
      else {
        var hbsObject = {articles: doc}
        res.render('index', hbsObject);
      }
    });

});


router.get('/scrape', function(req, res) {

  request('http://www.thewarfieldtheatre.com/events', function(error, response, html) {

    var $ = cheerio.load(html);

    var titlesArray = [];

    $('h3.carousel_item_title_small').each(function(i, element) {

        var result = {};

        result.title = $(this).children('a').text().trim();

        result.link = $(this).parent('div.title').parent('div.info').children('div.date-time-container').children('span.date').text().trim();
 
        result.summary = $(this).children('a').text().trim();
        console.log(result);

        result.venue = "The Warfield";  


        if(result.title !== "" &&  result.summary !== ""){

          if(titlesArray.indexOf(result.title) == -1){

            titlesArray.push(result.title);

            Article.count({ title: result.title}, function (err, test){

              if(test == 0){

                var entry = new Article (result);

                entry.save(function(err, doc) {

                  if (err) {
                    console.log(err);
                  } 
                
                  else {
                    console.log(doc);
                  }
                });

              }
      
              else{
                console.log('Not saved to DB, Reason : Redundant')
              }

            });
        }
   
        else{
          console.log('Not Saved to DB, Reason : Redundant')
        }

      }

      else{
        console.log('Not Saved to DB, Reason : Redundant')
      }

    });


  });

  request('http://www.theindependentsf.com/', function(error, response, html) {

    var $ = cheerio.load(html);

    var titlesArray = [];

    $('h1').each(function(i, element) {

        var result = {};

        result.title = $(this).children('a').text().trim();
  
        result.link = $(this).parent('div').children('h2.dates').text();

        result.summary = $(this).children('a').text().trim();
        console.log(result);

        result.venue = "The Independent SF";  

        if(result.title !== "" &&  result.summary !== ""){

          if(titlesArray.indexOf(result.title) == -1){

            titlesArray.push(result.title);

            Article.count({ title: result.title}, function (err, test){

              if(test == 0){

                var entry = new Article (result);

                entry.save(function(err, doc) {

                  if (err) {
                    console.log(err);
                  } 
       
                  else {
                    console.log(doc);
                  }
                });

              }
       
              else{
                console.log('Redundant Database Content. Not saved to DB.')
              }

            });
        }

        else{
          console.log('Redundant Content. Not Saved to DB.')
        }

      }

      else{
        console.log('Empty Content. Not Saved to DB.')
      }

    });
    

  });

  res.redirect("/articles");

});


router.post('/add/comment/:id', function (req, res){

  var articleId = req.params.id;
  
  var commentAuthor = req.body.name;

  var commentContent = req.body.comment;

  var result = {
    author: commentAuthor,
    content: commentContent
  };


  var entry = new Comment (result);

 
  entry.save(function(err, doc) {

    if (err) {
      console.log(err);
    } 

    else {

      Article.findOneAndUpdate({'_id': articleId}, {$push: {'comments':doc._id}}, {new: true})

      .exec(function(err, doc){

        if (err){
          console.log(err);
        } else {

          res.sendStatus(200);
        }
      });
    }
  });

});





router.post('/remove/comment/:id', function (req, res){

  var commentId = req.params.id;

  Comment.findByIdAndRemove(commentId, function (err, todo) {  
    
    if (err) {
      console.log(err);
    } 
    else {

      res.sendStatus(200);
    }

  });

});


module.exports = router;