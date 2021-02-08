const {cache}=require("../config/defaultConfig");

function refreshRes(stats,res){
    const {maxAge,expires,cacheControl,lastModified}=cache;
    if(expires){
        res.setHeader("Expires",(new Date(Date.now()+maxAge*1000)).toUTCString());
    }
    if(cacheControl){
        res.setHeader("Cache-Control",`public max-age=${maxAge}`);
    }
    if(lastModified){
        res.setHeader("Last-Modified",stats.mtime.toUTCString());
    }
    // if(etag){//一写Etag就出错 原因不得而知
    //     res.setHeader("ETag",`${stats.size}-${stats.mtime}`);
    // };
}

module.exports=function isFresh(stats,req,res){
    refreshRes(stats,res);
    const lastModified=req.headers["if-modified-since"];
    // const etag=req.headers["if-none-match"];
    if(!lastModified){
        return false;
    }
    if(lastModified&&lastModified!==res.getHeader("Last-Modified")){
        return false;
    }
    // if(etag&&etag!==res.getHeader("ETag")){
    //     return false;
    // };
    return true;
}
