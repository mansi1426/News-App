import React,{Component} from 'react';
import './news.css';
import Comments from './comments';

export default class News extends Component{
    constructor(props){
        super(props);
        this.state={data:{}, comment:true};
        this.got=false;
        this.callAjax.bind(this);
    }
    sendRec(cat){
        let id = localStorage.getItem('userId');
        fetch('http://localhost:5000/api/news/'+cat+'/'+id,{
            method:'GET',
            headers:{
                'Content-Type': 'application/json'
              }
        }).then(response=>response.json().then(data=>console.log(data)).catch(err=>console.log(err))).catch(err=>console.log(err));
    }
    callAjax(category){
        console.log(category);
        this.got=false;
        this.setState({data:{}});
        if(category=='general'){
            this.componentDidMount();
            return;
        }
        if(category=='recommended'){
            var id = localStorage.getItem('userId');
            console.log(category,id);
            fetch('http://localhost:5000/api/news/'+category+'?id='+id,{
                method:'GET'
            }).then(response=>{
                response.json().then(datas=>{
                    this.got=true;
                    console.log(datas);
                    this.setState({data:datas, comment:null});
                }).catch(err=>console.log(err));
            }).catch(err=>console.log(err));
        }
        else{
            fetch('http://localhost:5000/api/news/'+category,{
                method:'GET',
                headers:{
                    'Content-Type': 'application/json'
                }
            }).then(response=>{
                response.json().then(datas=>{
                    this.got=true;
                    this.setState({data:datas, comment: true});
                }).catch(err=>console.log(err));
            }).catch(err=>console.log(err));
        }
    }
    addComment(e,object){
        if((e.which|| e.keyCode) !== 13){
            return;
        }
        var comm = e.target.value;
        console.log(comm);
        this.refs.comment.value='';
        var obj = {
            id:object.id,
            text: comm,
            category:object.category
        }
        //  Send category, and article id,comment
        fetch('http://localhost:5000/api/news/comment',{
            method:'POST',
            body:JSON.stringify(obj),
            headers:{
                'Content-Type': 'application/json'
            }
        }).then(response=>{response.json().then(data=>this.setState({})).catch(err=>console.log(err))}).catch(err=>console.log(err));
        // this.setState({});
    }
    render(){
        
        if(!this.got){
            return(
                <div className="midd">
                <img src={require('../../../Images/load.gif')} alt="Loading..."/>
                </div>
            )
        }
        else{
            return(
            <div>
                {this.state.data.map(Obj=>{
                    console.log(Obj);
                    return(
                        <div>
                        <a className="full col-sm-12 col-12"  key={Obj.publishedAt} href={Obj.url} onClick={()=>{
                            if(Obj.category){
                            this.sendRec(Obj.category);
                        }
                        }} target='_blank'>
                            <img src={Obj.urlToImage} alt={Obj.category} className="col-12 col-sm-12"/>
                            <br/><br/>
                            <h4>{Obj.title}</h4>
                            <p>{Obj.description+'...'} </p>
                            <p>Source : {Obj.source.name}</p>
                        </a>
                        {  (this.state.comment) ?

                            Obj.comments.map(com=>{
                            return(
                                <Comments text={com.body} key={com._id} sentiment={com.sentiment}/>)

                                }) : null
                        }
                        {(this.state.comment) ? <input type="text" placeholder="Enter comment" ref="comment" onKeyDown={(e) => this.addComment(e, Obj)} /> : null}
                            </div>
                    )
                })}
            
            </div>
        )
    }
    }
    componentDidMount(){
        fetch('https://newsapi.org/v2/everything?pageSize=15&language=en&q=s',{
            method:'GET',
            headers:{
                'X-Api-Key':'41328392a1424640ae7813c460f22a58'
              }
        }).then(response=>{
            response.json().then(data=>{
                // console.log("Got Data");
                this.got=true;
                for(let i=0;i<data.articles.length;i++){
                    data.articles[i].comments=[];
                }
                this.setState({data:data.articles});
                console.log(data.articles);
                this.setState({});
            }).catch(err=>console.log(err));
        }).catch(err=>console.log(err));
    }
}