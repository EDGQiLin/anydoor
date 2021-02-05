const fs=require("fs");
const promisify=require("util").promisify;
const stat=promisify(fs.stat);
const readdir=promisify(fs.readdir);
const Handlebars=require("handlebars");
const path=require("path");
const conf=require("../config/defaultConfig");

const tplPath=path.join(__dirname,"../template/dir.tpl");
const source=fs.readFileSync(tplPath);
const template=Handlebars.compile(source.toString());

module.exports=async function(req,res,filePath){
    try{
        const stats=await stat(filePath);
        if(stats.isFile()){
            res.statusCode=200;
            res.setHeader("Content-Type","text/plain");
            fs.createReadStream(filePath).pipe(res);
        }else if(stats.isDirectory()){
            const files=await readdir(filePath);
            // fs.readdir(filePath,(err,files)=>{
                const dir=path.relative(conf.root,filePath);
                res.statusCode=200;
                res.setHeader("Content-Type","text/html");
                const data={
                    title:path.basename(filePath),
                    files,
                    dir:dir?`/${dir}`:""
                }
                res.end(template(data));
            // });
        };
    }catch(err){
        console.error(err);
        res.statusCode=404;
        res.setHeader("Content-Type","text/plain");
        res.end(`${filePath} is not a directory or a file\n${err.toString()}`);
        return;
    };
};