const fs=require("fs");
const promisify=require("util").promisify;
const stat=promisify(fs.stat);
const readdir=promisify(fs.readdir);
const Handlebars=require("handlebars");
const path=require("path");
// const conf=require("../config/defaultConfig");
const mime=require("./mime");
const compress=require("./compress");
const range=require("./range");
const isFresh=require("./cache");

const tplPath=path.join(__dirname,"../template/dir.tpl");
const source=fs.readFileSync(tplPath);
const template=Handlebars.compile(source.toString());

module.exports=async function(req,res,filePath,conf){
    try{
        const stats=await stat(filePath);
        if(stats.isFile()){
            const contentType=mime(filePath);
            res.setHeader("Content-Type",contentType);
            // fs.createReadStream(filePath).pipe(res);
            // console.log(isFresh(stats,req,res));
            if(isFresh(stats,req,res)){
                res.statusCode=304;
                res.end();
                return;
            }
            let rs;
            const {code,start,end}=range(stats.size,req,res);
            if(code===200){
                res.statusCode=200;
                rs=fs.createReadStream(filePath);
            }else{
                res.statusCode=200;
                rs=fs.createReadStream(filePath,{
                    start,end
                });
            }
            // console.log(filePath);
            // console.log(filePath.match(conf.compress));
            if(filePath.match(conf.compress)){
                // console.log(111);
                rs=compress(rs,req,res);
            }
            return rs.pipe(res);
        }else if(stats.isDirectory()){
            const files=await readdir(filePath);
            // fs.readdir(filePath,(err,files)=>{
                const dir=path.relative(conf.root,filePath);
                // console.log(dir,filePath);
                res.statusCode=200;
                res.setHeader("Content-Type","text/html");
                const data={
                    title:path.basename(filePath),
                    files:files.map((key)=>{
                        return {
                            file:key,
                            icon:mime(key)
                        }
                    }),
                    dir:dir?`/${dir}`:""
                }
                res.end(template(data));
            // });
        }
    }catch(err){
        console.error(err);
        res.statusCode=404;
        res.setHeader("Content-Type","text/plain");
        res.end(`${filePath} is not a directory or a file\n${err.toString()}`);
        return;
    }
};
