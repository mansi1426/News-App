const router = require('express').Router();
const fetch = require('node-fetch');
const uuid = require('uuid/v1');
const News = require('../../models/news');
const getNews = require('../../util/fetch-news');
const User = require('../../models/user');

router.get('/recommended', (req, res) => {
  const { PythonShell } = require('python-shell');
  PythonShell.run('pyScripts/test.py', {
    args: [req.query.id]
  }, async (err, data) => {
    if(err) res.send(err);
    let src = JSON.parse(data[0]);
    let arr = [];
    for(let key in src) {
      src[key] = src[key] / 5;
      arr.push([key, src[key]]);
    }
    arr.sort((a, b) => b[1] - a[1]);
    let query = arr.slice(0, 5)
                   .reduce(
                     (acc, curr) => acc + curr[0] + ',',
                      '');
    query = query.slice(0, query.length - 1);
    const response = await fetch(`https://newsapi.org/v2/top-headlines?pageSize=15&sources=${query}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': process.env.API_KEY
      }
    });
    const articles = await response.json();
    res.json([...articles.articles]);
  });
});

router.get('/:category', async (req, res) => {
  const categories = ['business', 'entertainment', 'health', 'science', 'sports', 'technology'];
  if(categories.indexOf(req.params.category) === -1) {
    res.status(404).send('Page Not Found');
    return;
  } 
  
  try {
    let articles = await getNews(req.params.category);
    articles = articles.map(article => {
      return {
          ...article,
          category: req.params.category,
          id: uuid()
      };
    });

    let news = await News.findOne({ category: req.params.category });
    if(news === null) {
      news = new News;
      news.category = req.params.category;
      articles.forEach(article => {
        if(article.title)
          news.articles.push(article);
      });
    } else {
      let newNews = new Map();
      articles.forEach(article => newNews.set(article.title, article));
      let oldNews = new Map();
      news.articles.forEach(article => oldNews.set(article.title, article));
      let merged = new Map([...newNews, ...oldNews]);
      news.articles = [];
      
      merged.forEach(value => value.title ? news.articles.push(value) : null);
    }
    
    news.save(() => console.log('saved'));
    res.json(news.articles);
  } catch (error) {
    console.log(error);
  }
});

router.get('/:category/:id', async (req, res) => {
  const categories = ['business', 'entertainment', 'health', 'science', 'sports', 'technology'];
  if (categories.indexOf(req.params.category) === -1) {
    res.status(404).send('Page Not Found');
    return;
  } 

  const news = await News.findOne({ category: req.params.category });
  const post = news.articles.filter(article => article.id === req.params.id ? article : null);

  if(post[0]) {
    const user = await User.findById(req.params.id);
    const category = user.news.filter(item => item.category === req.params.category ? item : null);
    if(category[0]) {
      category[0].count += 1;
      category[0].sources.forEach(source => {
        if(source.source === post[0].source.id) {
          source.count += 1;
        }
      });
    }
    user.save(() => console.log('Updated'));
  }
  res.end();
});

router.post('/comment', async (req, res) => {
  console.log(req.body);
  const response = await fetch('http://localhost:9000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({text: req.body.text})
  });
  const data = await response.json();
  console.log(data);
  const news = await News.findOne({ category: req.body.category });
  const article = news.articles.filter(article => article.id === req.body.id);
  console.log(article[0].comments);
  article[0].comments.push({
    body: req.body.text,
    sentiment: data
  });
  news.save(() => console.log('Updated Successfully'));
  res.send(article);
})

module.exports = router;