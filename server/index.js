
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { Courses } from './models/courses.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
import cors from 'cors';
app.use(cors());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const mongoURI = 'mongodb://localhost:27017/Elearning'; 
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });


app.post('/admin/courses', upload.fields([{ name: 'image' }, { name: 'videos' }]), async (req, res) => {
  try {
    const { title, description, price, category, duration } = req.body;

    const imagePath = req.files.image[0].path;  
    const videoPaths = req.files.videos.map(file => file.path); 

    const newCourse = new Courses({
      title,
      description,
      price,
      category,
      duration,
      image: imagePath,
      videos: videoPaths,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: 'Error creating course', error });
  }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/courses', async (req, res) => {
  try {
    const courses = await Courses.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error });
  }
});


app.delete('/admin/courses/:id', async (req, res) => {
  try {
    const course = await Courses.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

   
    if (course.image && fs.existsSync(course.image)) {
      fs.unlinkSync(course.image);
    }

   
    if (course.videos && course.videos.length > 0) {
      course.videos.forEach((video) => {
        if (fs.existsSync(video)) {
          fs.unlinkSync(video);
        }
      });
    }

   
    await Courses.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
