# Administrator Guide: Permission Management

## Overview

The HMS (Hospital Management System) features a comprehensive permission management system that allows administrators to control user access to various system functions. This guide covers the key features and best practices for managing permissions effectively.

## Key Concepts

### Permission Types

1. **Role-Based Permissions**: Assigned to user roles (e.g., Reception Admin, Pharmacy Admin)
2. **User-Specific Permissions**: Individual overrides for specific users
3. **Temporary Permissions**: Time-limited permissions for special circumstances

### Permission Dependencies

Some permissions require others to function properly. For example:
- `edit-users` requires `view-users`
- `delete-patients` requires `view-patients` and `edit-patients`

The system automatically validates these dependencies when assigning permissions.

## Managing Role Permissions

### Viewing Current Permissions

1. Navigate to **Admin → Permissions**
2. View the permissions matrix showing:
   - Available permissions (rows)
   - User roles (columns)
   - Checkmarks indicating assigned permissions

### Modifying Role Permissions

1. From the permissions index page, click **"Edit"** next to a role
2. Check/uncheck permissions as needed
3. Click **"Update Permissions"**
4. The system validates permission dependencies automatically

### Resetting Role Permissions

To restore default permissions for a role:

1. Click **"Reset to Default"** next to the role
2. Confirm the action
3. Default permissions are restored based on system configuration

## Managing User-Specific Permissions

### Adding Individual Permissions

1. Navigate to **Admin → Users**
2. Click **"Edit Permissions"** next to a user
3. Check permissions to grant to this specific user
4. Click **"Update Permissions"**

### Permission Override Behavior

- **User-specific permissions take precedence** over role permissions
- If a user has a permission through their role but it's explicitly denied at the user level, they won't have access
- Use this feature for exceptional cases only

## Temporary Permissions

### When to Use Temporary Permissions

Temporary permissions are useful for:
- Covering staff shortages
- Training new employees
- Emergency access situations
- Audits and special projects

### Granting Temporary Permissions

1. Navigate to **Admin → Permissions → Temporary Permissions**
2. Click **"Grant Temporary Permission"**
3. Select:
   - **User**: Who needs the permission
   - **Permission**: Which permission to grant
   - **Expiration**: When the permission should expire
   - **Reason**: Detailed explanation (required for audit trail)
4. Click **"Grant Permission"**

### Managing Active Temporary Permissions

- View all active temporary permissions on the main temporary permissions page
- Filter by user or permission
- Revoke permissions early if needed (only by the original granter or super admin)
- System automatically expires permissions at the specified time

### Best Practices for Temporary Permissions

- **Always provide detailed reasons** for audit purposes
- **Set appropriate expiration times** (hours to days, not weeks/months)
- **Monitor active temporary permissions** regularly
- **Revoke immediately** when no longer needed

## Permission Approval Workflow

### Overview

For sensitive permission changes, the system requires approval through a structured workflow:

1. **Request Creation**: Junior admin requests permission changes
2. **Review**: Senior admin reviews the request
3. **Approval/Rejection**: Senior admin approves or rejects with reasoning
4. **Automatic Application**: Approved changes are applied automatically

### Creating Permission Change Requests

1. Navigate to **Admin → Permissions → Change Requests**
2. Click **"Create Request"**
3. Specify:
   - **Target User**: Whose permissions to change
   - **Permissions to Add/Remove**: Select from dropdowns
   - **Reason**: Detailed justification
   - **Expiration** (optional): When the request expires if not processed
4. Click **"Submit Request"**

### Processing Requests

As an approver:

1. Review pending requests in **Admin → Permissions → Change Requests**
2. Click **"View Details"** to see full request information
3. **Approve** or **Reject** based on:
   - Business justification
   - Permission dependencies
   - Risk assessment
   - Compliance requirements

### Approval Considerations

Consider these factors when approving requests:
- **Business Need**: Is there a legitimate business requirement?
- **Least Privilege**: Are they requesting only what's needed?
- **Dependencies**: Are all required dependencies satisfied?
- **Risk Level**: How sensitive are the requested permissions?
- **Training**: Is the user adequately trained for these permissions?

## Security Monitoring

### Anomaly Detection

The system automatically detects suspicious permission activities:

- **Bulk Grants**: Multiple permissions granted in a short time
- **High-Risk Permissions**: Sensitive permissions granted frequently
- **Unusual Hours**: Permission changes during off-hours
- **Escalation Attempts**: Users requesting permissions they shouldn't have

### Reviewing Anomalies

1. Check system logs for anomaly alerts
2. Review recent permission changes
3. Investigate unusual patterns
4. Take corrective actions as needed

## Audit Logging

### What Gets Logged

All permission-related activities are logged:
- Permission assignments and removals
- Temporary permission grants and revocations
- Approval workflow actions
- Failed access attempts
- Administrative actions

### Accessing Audit Logs

1. Navigate to **Admin → Security → Audit Logs**
2. Filter by:
   - User
   - Action type
   - Date range
   - Permission type

## Best Practices

### Permission Management

1. **Follow the Principle of Least Privilege**
   - Grant only the minimum permissions required
   - Regularly review and revoke unnecessary permissions

2. **Use Roles Effectively**
   - Define clear role responsibilities
   - Keep role permissions up to date
   - Use user-specific permissions sparingly

3. **Monitor and Audit**
   - Regularly review active permissions
   - Monitor for unusual activities
   - Maintain detailed audit trails

### Temporary Permissions

1. **Limit Duration**
   - Keep temporary permissions short-term
   - Set specific expiration times
   - Monitor for timely revocation

2. **Document Thoroughly**
   - Always provide detailed reasons
   - Link to business justification
   - Include approval references

### Approval Workflows

1. **Establish Clear Criteria**
   - Define approval requirements by permission sensitivity
   - Set time limits for review
   - Document approval processes

2. **Train Approvers**
   - Ensure approvers understand permission implications
   - Provide guidelines for risk assessment
   - Regular training on security best practices

## Troubleshooting

### Common Issues

**Permission Not Taking Effect**
- Check if user-specific overrides are blocking role permissions
- Verify permission dependencies are satisfied
- Clear application cache if needed

**Temporary Permission Not Working**
- Verify the permission hasn't expired
- Check if it was revoked
- Confirm the user still exists

**Dependency Validation Errors**
- Review which permissions require others
- Ensure all prerequisite permissions are assigned
- Check permission configuration

### Getting Help

- Consult the technical documentation for detailed API references
- Check system logs for error details
- Contact the development team for configuration issues

## Emergency Procedures

### Revoking Access Immediately

1. For immediate security concerns:
   - Navigate to user management
   - Remove user-specific permissions
   - Revoke any active temporary permissions
   - Consider account suspension if needed

2. **Document all emergency actions** for audit purposes

### Restoring Access

1. After security incident resolution:
   - Carefully restore only necessary permissions
   - Use temporary permissions initially
   - Implement additional monitoring

## Compliance Considerations

- **Maintain audit trails** for regulatory compliance
- **Regular permission reviews** as part of security assessments
- **Document approval processes** for compliance audits
- **Implement separation of duties** where required

Remember: Permission management is a critical security function. Always err on the side of caution and maintain detailed documentation of all changes.
