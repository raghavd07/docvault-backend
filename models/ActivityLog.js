const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'login',
        'logout',
        'upload',
        'download',
        'delete',
        'restore',
        'share',
        'submit',
        'create_user',
        'update_user',
        'deactivate_user',
        'activate_user',
        'create_department',
        'create_course',
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    resource: {
      type: String,
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);