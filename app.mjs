// app.mjs

import express from 'express';
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid';
import path from 'path'
import url from 'url';
import { fileURLToPath } from 'url';
import { Query } from './query.mjs';
import { json } from 'stream/consumers';

const PORT = 3000;
const app = express();


app.set('view engine', 'hbs');




// Root path
const basePath = path.dirname(url.fileURLToPath(import.meta.url));
const publicPath = path.resolve(basePath, "public")

// Middleware
app.use(express.static(publicPath));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

// Building the Questions Database
let queries = [];
const server = fs.readFile("code-samples/question-bank.json" , function(err , data){
    if (err)
    {
        console.log(err);
    }
    const jsonData = JSON.parse(data);
    
    for (const item of jsonData)
    {
        const id = uuidv4();
        const query = new Query(id , item["question"] , item["genre"] , item["answers"]);
        queries.push(query);
    }
    console.log(queries);

    // Setting up the Server
    const server = app.listen(PORT, () => {
        console.log("Server started; type CTRL+C to shut down");
    });
    
    
    
    // Routes
    app.get('/', (req, res) => {
        res.redirect('/quiz');
    });

    app.post('/quiz' , (req , res) =>
    {
        const userAnswers = req.body.answer.split(",");
        const id = req.body.id;
        let index = 0
        let correctAnswers = []
        for (let i = 0; i < queries.length; i++)
        {
            if(queries[i].id === id)
            {
                correctAnswers = queries[i].answers;
                index = i
                break;
            }
        }
        
        const result = validate(correctAnswers , userAnswers)
        console.log(result);
        res.render('quiz' , {queries: queries[index] , result})
        
        
    });

    app.get('/quiz', (req, res) => {
        const randInt = Math.floor(Math.random() * queries.length);
        res.render('quiz' , {queries: queries[randInt]});
        });

    app.post('/questions' , (req , res)=>
    {
        if (req.body.question)
        {
            const id = uuidv4();
            console.log(req.body);
            const query = new Query(id , req.body["question"] , req.body["genre"] , req.body["answers"].split(","));
            console.log(query);
            queries.push(query);
        }
        
        res.redirect('/questions');
    })


    app.get('/questions' , (req , res) => {
        let searchParam = req.query.search;
        if(searchParam)
            {
                searchParam = searchParam.toLowerCase();
                const matchingItems = []
                for (let i = 0; i < queries.length; i++)
                {
                    const query = queries[i]
                    if(query.question.toLowerCase().indexOf(searchParam) != -1){
                        matchingItems.push(queries[i]);
                    }
                    else if(query.genre.toLowerCase() === searchParam)
                    {
                        matchingItems.push(query);
                    }
                    else if (query.answers.find(element => (element.toLowerCase() === searchParam)))
                    {
                        matchingItems.push(queries[i]);
                    }
                }

                res.render('questions' , {queries:matchingItems});
            }
        else{res.render('questions' , {queries: queries});}
        
        console.log(searchParam);
        
        
    });
    
    return server;
    
});

export{server, app};


// Middleware
app.use(express.static(publicPath));
app.use(express.urlencoded({extended:false}));

app.use(function(req , res , next)
{
    console.log("Method:" , req.method);
    console.log("Path:" , req.path);
    console.log(typeof(req.query));
	next();
});



// Implement the decorate function
export const decorate = (answer, correct) => {
    if(correct){
        return `<span class="correct-answer" style="color:green">${answer.trim()}</span>`;
    }
    else
    {
        return `<span class="incorrect-answer" style="color:red">${answer.trim()}</span>`;
    }
}

export const validate = (correctAnswers, userAnswer) =>
{
    let evaluations = []
    let correct = 0;
    let incorrect = 0;

    for(let j = 0; j < userAnswer.length; j++)
    {
        let isCorrect = false;
        console.log(userAnswer[j].trim().toLowerCase() , "\n")
        
        // Checking each user answer with each correct answer 
        for (let i = 0; i < correctAnswers.length; i++)
        {
            console.log(correctAnswers[i].trim().toLowerCase() , "\n")
            if (correctAnswers[i].trim().toLowerCase() === userAnswer[j].trim().toLowerCase())
            {
                isCorrect = true;                    
                break;
            }
        }
        if(isCorrect){
            correct++;
        }
        else{
            incorrect++
        }
        evaluations.push(decorate(userAnswer[j] , isCorrect));
    }

    // Correctness of Solution
    if(!correct){
        return[evaluations , "Incorrect"]
    }
    else if(!incorrect && correct === correctAnswers.length){
        return[evaluations , "Correct"]
    }
    else{
        return[evaluations , "Partially Correct"]
    }
}






