# 数据库连接配置
class Config:
    # MySQL连接URI格式：mysql+pymysql://用户名:密码@主机:端口/数据库名?字符集
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:123456@localhost:3306/btl_robotics?charset=utf8mb4'
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # 关闭追踪修改（优化性能）
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config  # 引入配置

app = Flask(__name__)
app.config.from_object(Config)  # 加载配置
db = SQLAlchemy(app)  # 初始化数据库连接

# 测试连接
with app.app_context():
    try:
        db.engine.connect()
        print('数据库连接成功！')
    except Exception as e:
        print('数据库连接失败：', e)

