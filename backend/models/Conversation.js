const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
      default: null,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['direct', 'group', 'department'],
      default: 'direct',
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    avatarColor: {
      type: String,
      trim: true,
      default: '#0f766e',
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: 'A conversation must have at least two participants.',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      body: {
        type: String,
        trim: true,
        default: '',
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    directKey: {
      type: String,
      trim: true,
      default: undefined,
    },
    departmentKey: {
      type: String,
      trim: true,
      default: undefined,
    },
    managedKey: {
      type: String,
      trim: true,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ 'participants.user': 1, lastActivityAt: -1 });
conversationSchema.index(
  { directKey: 1 },
  {
    unique: true,
    partialFilterExpression: { directKey: { $type: 'string' } },
  }
);
conversationSchema.index(
  { departmentKey: 1 },
  {
    unique: true,
    partialFilterExpression: { departmentKey: { $type: 'string' } },
  }
);
conversationSchema.index(
  { managedKey: 1 },
  {
    unique: true,
    partialFilterExpression: { managedKey: { $type: 'string' } },
  }
);

conversationSchema.pre('validate', function normalizeConversationKeys(next) {
  if (!this.directKey) this.directKey = undefined;
  if (!this.departmentKey) this.departmentKey = undefined;
  if (!this.managedKey) this.managedKey = undefined;
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
