const asyncHandler = require('express-async-handler');
const path = require('path');
const SalesOnboardingCourse = require('../models/SalesOnboardingCourse');
const { File } = require('node-fetch-native-with-agent');
const { storage } = require('../../config/appwriteClient');

const COURSE_KEY = 'sales-onboarding';

const fallbackCourseData = {
  title: 'Sales Onboarding Course',
  overview:
    'Published by Sales Manager. Complete all chapters and the quiz to finish onboarding.',
  passPercentage: 75,
  slides: [
    {
      title: 'Welcome',
      body: 'Welcome to the onboarding course. Start here to understand your sales role.',
      imageUrl: '',
      imageUrls: [],
      materialUrl: '',
    },
    {
      title: 'Mission',
      body: 'Your mission is to identify customer needs and match them to the right solution.',
      imageUrl: '',
      imageUrls: [],
      materialUrl: '',
    },
  ],
  quizQuestions: [
    {
      question: 'What is the first step in the sales process?',
      options: ['Close the deal', 'Qualify the lead'],
      correctAnswer: 1,
      explanation: '',
    },
  ],
};

const asText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const uniqueTextArray = (value = []) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => asText(item, ''))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
};

const normalizeSlides = (slides = []) => {
  if (!Array.isArray(slides)) return [];

  return slides
    .map((slide, index) => {
      const title = asText(slide?.title, `Chapter ${index + 1}`);
      const body = asText(slide?.body, '');
      const imageUrls = uniqueTextArray([
        asText(slide?.imageUrl, ''),
        ...(Array.isArray(slide?.imageUrls) ? slide.imageUrls : []),
      ]);
      const imageUrl = imageUrls[0] || '';
      const materialUrl = asText(slide?.materialUrl, '');
      const hasContent = title || body || imageUrl || materialUrl || imageUrls.length > 0;
      if (!hasContent) return null;

      return { title, body, imageUrl, imageUrls, materialUrl };
    })
    .filter(Boolean);
};

const normalizeQuizQuestions = (quizQuestions = []) => {
  if (!Array.isArray(quizQuestions)) return [];

  return quizQuestions
    .map((quiz, index) => {
      const question = asText(quiz?.question, `Question ${index + 1}`);
      const options = Array.isArray(quiz?.options)
        ? quiz.options.map((option) => asText(option, '')).filter(Boolean)
        : [];
      if (!question || options.length < 2) {
        return null;
      }

      const requestedAnswer = Number(quiz?.correctAnswer);
      const correctAnswer = Number.isFinite(requestedAnswer)
        ? clamp(Math.trunc(requestedAnswer), 0, options.length - 1)
        : 0;

      return {
        question,
        options,
        correctAnswer,
        explanation: asText(quiz?.explanation, ''),
      };
    })
    .filter(Boolean);
};

const getCoursePayload = (body = {}) => {
  const passInput = Number(body.passPercentage);
  const passPercentage = Number.isFinite(passInput) ? clamp(passInput, 0, 100) : 75;

  return {
    title: asText(body.title, fallbackCourseData.title),
    overview: asText(body.overview, fallbackCourseData.overview),
    passPercentage,
    slides: normalizeSlides(body.slides),
    quizQuestions: normalizeQuizQuestions(body.quizQuestions),
  };
};

const buildAppwriteFileUrl = (fileId) =>
  `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

const getMissingAppwriteConfig = () =>
  ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'APPWRITE_BUCKET_ID'].filter(
    (key) => !process.env[key]
  );

const getPublishedCourse = asyncHandler(async (req, res) => {
  const course = await SalesOnboardingCourse.findOne({
    key: COURSE_KEY,
    isPublished: true,
  });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'No published sales onboarding course found.',
    });
  }

  res.json({ success: true, data: course });
});

const getManagerCourse = asyncHandler(async (req, res) => {
  const course = await SalesOnboardingCourse.findOne({ key: COURSE_KEY });

  if (!course) {
    return res.json({
      success: true,
      data: {
        ...fallbackCourseData,
        key: COURSE_KEY,
        isPublished: false,
        publishedAt: null,
      },
      meta: { isNew: true },
    });
  }

  res.json({
    success: true,
    data: course,
    meta: { isNew: false },
  });
});

const saveManagerCourse = asyncHandler(async (req, res) => {
  const payload = getCoursePayload(req.body);
  let course = await SalesOnboardingCourse.findOne({ key: COURSE_KEY });

  if (!course) {
    course = new SalesOnboardingCourse({
      key: COURSE_KEY,
      ...fallbackCourseData,
      createdBy: req.user?._id || null,
    });
  }

  course.title = payload.title;
  course.overview = payload.overview;
  course.passPercentage = payload.passPercentage;
  course.slides = payload.slides;
  course.quizQuestions = payload.quizQuestions;
  course.updatedBy = req.user?._id || null;

  const saved = await course.save();

  res.json({
    success: true,
    message: 'Course draft saved.',
    data: saved,
  });
});

const publishManagerCourse = asyncHandler(async (req, res) => {
  let course = await SalesOnboardingCourse.findOne({ key: COURSE_KEY });

  if (!course) {
    course = new SalesOnboardingCourse({
      key: COURSE_KEY,
      ...fallbackCourseData,
      createdBy: req.user?._id || null,
    });
  }

  course.isPublished = true;
  course.publishedAt = new Date();
  course.updatedBy = req.user?._id || null;

  const saved = await course.save();

  res.json({
    success: true,
    message: 'Course published successfully.',
    data: saved,
  });
});

const uploadSlideImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required.',
    });
  }

  if (!req.file.mimetype?.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      message: 'Only image uploads are supported for onboarding slides.',
    });
  }

  const missingConfig = getMissingAppwriteConfig();

  if (missingConfig.length) {
    return res.status(500).json({
      success: false,
      message: `Appwrite storage is not configured. Missing: ${missingConfig.join(', ')}`,
    });
  }

  const originalName = path.basename(req.file.originalname || 'upload');
  const safeName = originalName.replace(/\s+/g, '-');
  const fileName = `sales-onboarding-${Date.now()}-${safeName}`;
  const file = new File([req.file.buffer], fileName, {
    type: req.file.mimetype || 'application/octet-stream',
  });

  let uploaded;

  try {
    uploaded = await storage.createFile({
      bucketId: process.env.APPWRITE_BUCKET_ID,
      fileId: 'unique()',
      file,
    });
  } catch (error) {
    console.error('Sales onboarding slide image upload failed:', {
      message: error?.message,
      code: error?.code,
      type: error?.type,
      response: error?.response,
      fileName,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(502).json({
      success: false,
      message: error?.response?.message || error?.message || 'Image upload failed.',
    });
  }

  const fileId = uploaded?.$id;

  if (!fileId) {
    console.error('Sales onboarding slide image upload returned no file id.', {
      uploaded,
      fileName,
    });

    return res.status(502).json({
      success: false,
      message: 'Image upload failed: storage service returned no file id.',
    });
  }

  const fileUrl = buildAppwriteFileUrl(fileId);

  res.status(201).json({
    success: true,
    message: 'Slide image uploaded successfully.',
    data: {
      fileId,
      fileUrl,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

module.exports = {
  getPublishedCourse,
  getManagerCourse,
  saveManagerCourse,
  publishManagerCourse,
  uploadSlideImage,
};
