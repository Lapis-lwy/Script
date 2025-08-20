// ==UserScript==
// @name         PixivInfo
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  查看本地是否存在该图片
// @author       Lapis_lwy
// @match        *://www.pixiv.net/artworks/*
// @match        *://danbooru.donmai.us/posts/*
// @match        https://learn.scriptcat.org/*
// @icon         https://www.pixiv.net/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      file.125114.xyz
// @updateURL    https://raw.githubusercontent.com/Lapis-lwy/Tampermonky/refs/heads/main/PixivInfo.js
// @downloadURL  https://raw.githubusercontent.com/Lapis-lwy/Tampermonky/refs/heads/main/PixivInfo.js
// ==/UserScript==
let noneArr=[undefined,""];
function loginUi(url,div){
    let log=document.createElement("div");
    log.style.cssFloat = 'right';
    log.id="login";
    let userTip=document.createElement("font");
    userTip.size=3;
    userTip.textContent="用户名：";
    log.append(userTip);
    let user=document.createElement("input");
    user.type="text";
    user.id="username";
    user.placeholder="请输入用户名";
    log.append(user);
    let space=document.createElement("font");
    space.size=3;
    space.textContent="  ";
    log.append(space);
    let passTip=document.createElement("font");
    passTip.size=3;
    passTip.textContent="密码：";
    log.append(passTip);
    let passwd=document.createElement("input");
    passwd.type="text";
    passwd.id="password";
    passwd.placeholder="请输入密码";
    log.append(passwd);
    log.style.display="none";
    let btn=document.createElement("button");
    btn.innerHTML="登录";
    log.append(btn);
    if(noneArr.includes(GM_getValue("username")) || noneArr.includes(GM_getValue("password"))){
        log.style.display="block";
    }
    div.append(log);
    return {userElem:user,passwordElem:passwd,buttonElem:btn,loginElem:log}
}
async function login(url){
    //登录
    return await new Promise((res,rej)=>{
        GM_xmlhttpRequest({method:"POST",url:url+"login",data:'{"username":"'+GM_getValue("username")+'","password":"'+GM_getValue("password")+'","recaptcha":""}',
                           onload:(response)=>{
                               if(response.responseText.trim()==="403 Forbidden" || response.status=="502"){
                                   rej(response.status);
                               }else {
                                   GM_setValue("auth",response.responseText);
                                   res();
                               }
                           }
                          });
    });
}

(function() {
    'use strict';
    window.addEventListener('pushState', function (e) {
        console.warn(
        "href changed to"+ window.location.href
        ); 
        GM_setValue("auth","");
        let url="https://file.125114.xyz:27567/api/";
        let div = document.createElement("div");
        div.style.backgroundColor="white";
        if(GM_getValue("status")===1){
            div.innerHTML="<label><input type=\"radio\" name=\"pic\" value=\"pc\" style=\"width:14px;height:14px\"> <font size=\"3\">横图</font></label>    <label><input type=\"radio\" name=\"pic\" value=\"mobile\" style=\"width:14px;height:14px\" checked> <font size=\"3\">纵图</font></label>    "
        }else{
            div.innerHTML="<label><input type=\"radio\" name=\"pic\" value=\"pc\" style=\"width:14px;height:14px\" checked> <font size=\"3\">横图</font></label>    <label><input type=\"radio\" name=\"pic\" value=\"mobile\" style=\"width:14px;height:14px\"> <font size=\"3\">纵图</font></label>    "
            GM_setValue("status",0);
        }
        let loginUiElem = loginUi(url,div);
        document.body.prepend(div);
        let tip=document.createElement("h2");
        tip.align="center";
        tip.style.margin="0px";
        tip.style.padding="12px";
        let clickEvent=function(url,direction,tip){
            if (GM_getValue("auth")===""){
                tip.textContent="⚠️您还未登录！";
                div.append(tip);
                return;
            }
            search(url+"search/",direction).then(()=>{
                if (GM_getValue("download")===0){
                    tip.textContent="✔️本图片尚未下载";
                    tip.style.color="green";
                }
                if (GM_getValue("download")===1){
                    tip.textContent="❌️本图片已下载";
                    tip.style.color="red";
                }
            })

        }
        let loginEvent=()=>{
            if(noneArr.includes(GM_getValue("username")) || noneArr.includes(GM_getValue("password"))){
                GM_setValue("username",loginUiElem.userElem.value);
                GM_setValue("password",loginUiElem.passwordElem.value);
            }
            login(url).then((res)=>{
                loginUiElem.loginElem.innerHTML="";
                let suc=document.createElement("h3");
                suc.textContent="登录成功！";
                suc.style.color="green";
                loginUiElem.loginElem.append(suc);
                loginUiElem.loginElem.style.display="block";
                clickEvent(url,div.getElementsByTagName("input")[GM_getValue("status")].value,tip);
            },(rej)=>{
                if(rej=="502"){
                    alert("服务器异常，请稍后重试！");
                }else alert("用户名或密码错误！");
                loginUiElem.loginElem.style.display="block";
                GM_setValue("username","");
                GM_setValue("password","");
            });
        }
        if(!noneArr.includes(GM_getValue("username")) && !noneArr.includes(GM_getValue("password"))){
            loginEvent();
        }
        clickEvent(url,div.getElementsByTagName("input")[GM_getValue("status")].value,tip);
        loginUiElem.buttonElem.onclick=()=>{
            if(loginUiElem.userElem.value==="" || loginUiElem.passwordElem.value===""){
                alert("输入框为空！");
                return;
            }
            loginEvent();
        };
        div.onclick = (event)=>{
            if(event.target.value===undefined) return;
            if(event.target.value==="pc") GM_setValue("status",0);
            if(event.target.value==="mobile") GM_setValue("status",1);
            clickEvent(url,event.target.value,tip);
        };
        div.append(tip);    
    }
)})();
async function search(url,direction){
    let flag=-1;
    let picId;
    if(window.location.hostname=="www.pixiv.net"){
        flag++;
        picId=window.location.href.split("/").at(-1);
    }else{
        let fullUrl=document.querySelector("#post-info-source").textContent;
        if(fullUrl.split(" ").at(1).split("/").at(0)==="pixiv.net"){//Pixiv来源
            picId=fullUrl.split(" ").at(1).split("/").at(-1).split(" ").at(0);
            await pixiv(url,picId,direction);
            if (GM_getValue("download")===1) return await new Promise(res=>{res()});
        }
        picId=document.querySelector("#image").src.split("sample-").at(-1).split(".").at(0);
    }
    return await sendReq(url,flag,picId,direction);
}
function sendReq(url,flag,picId,direction){
    return new Promise (res=>{
        GM_xmlhttpRequest({method:"GET",url:url+direction+"/?query="+picId,headers:{
            "x-auth":GM_getValue("auth")
        },onload:(response)=>{
            let arr=new Set(JSON.parse(response.responseText).map(function(elem){return elem.path.split("_").at(flag).split(".").at(0).split("/").at(-1)}));
            console.log(arr);
            GM_setValue("download",0);
            for(let elem of arr){
                if(elem===picId) {
                    GM_setValue("download",1);
                    break;//检查id是否完全相等，有些id是另一个id的一部分
                }
            }
            res();
        }})
    })}
function pixiv(url,pixivId,direction){
    return sendReq(url,0,pixivId,direction);
}










