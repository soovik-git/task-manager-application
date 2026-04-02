import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A task must have a title'],
    trim: true,
    maxlength: [100, 'A task title must have less or equal then 100 characters'],
    minlength: [3, 'A task title must have more or equal then 3 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'A task description must have less or equal then 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'ongoing', 'completed'],
      message: 'Status is either: pending, ongoing, completed'
    },
    default: 'pending'
  },
  user_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Task must belong to a user.']
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id mapped to _id
taskSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Query Middleware to only return non-deleted tasks
taskSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.where({ deleted_at: null });
  next();
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
