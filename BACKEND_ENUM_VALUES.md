# Backend Enum Values - Job Posting

## Issue Fixed: Invalid Enum Value "subsidized"

**Error**: `invalid input value for enum job_contracts_food_enum: "subsidized"`

**Root Cause**: Frontend was using `"subsidized"` which doesn't exist in the backend enum.

## Correct Enum Values (from domain.entity.ts)

### Overtime Policy
```typescript
enum: ['as_per_company_policy', 'paid', 'unpaid', 'not_applicable']
```

**Frontend Options**:
- `as_per_company_policy` - "As Per Company Policy" (default)
- `paid` - "Paid"
- `unpaid` - "Unpaid"
- `not_applicable` - "Not Applicable"

### Food, Accommodation, Transport
```typescript
enum: ['free', 'paid', 'not_provided']
```

**Frontend Options**:
- `free` - "Free"
- `paid` - "Paid by Worker"
- `not_provided` - "Not Provided"

**Note**: All three fields (food, accommodation, transport) use the same enum values.

## Test File Values

From `agency_owner_create_agency.test.ts`:
```typescript
contract: {
  period_years: 2,
  renewable: true,
  hours_per_day: 8,
  days_per_week: 6,
  overtime_policy: "paid",        // ✅ Valid
  weekly_off_days: 1,
  food: "free",                   // ✅ Valid
  accommodation: "free",          // ✅ Valid
  transport: "free",              // ✅ Valid
  annual_leave_days: 30
}
```

## Entity Definitions

### JobContract Entity
```typescript
@Entity('job_contracts')
export class JobContract extends BaseEntity {
  @Column({ type: 'integer' })
  period_years: number;

  @Column({ type: 'boolean', default: false })
  renewable: boolean;

  @Column({ type: 'integer', nullable: true })
  hours_per_day?: number;

  @Column({ type: 'integer', nullable: true })
  days_per_week?: number;

  @Column({
    type: 'enum',
    enum: ['as_per_company_policy', 'paid', 'unpaid', 'not_applicable'],
    nullable: true,
    default: 'as_per_company_policy'
  })
  overtime_policy?: string;

  @Column({ type: 'integer', nullable: true })
  weekly_off_days?: number;

  @Column({
    type: 'enum',
    enum: ['free', 'paid', 'not_provided'],
    nullable: true
  })
  food?: string;

  @Column({
    type: 'enum',
    enum: ['free', 'paid', 'not_provided'],
    nullable: true
  })
  accommodation?: string;

  @Column({
    type: 'enum',
    enum: ['free', 'paid', 'not_provided'],
    nullable: true
  })
  transport?: string;

  @Column({ type: 'integer', nullable: true })
  annual_leave_days?: number;
}
```

### JobPosition Entity (Overrides)
```typescript
@Entity('job_positions')
export class JobPosition extends BaseEntity {
  // Position-specific overrides (same enum values)
  @Column({ type: 'integer', nullable: true })
  hours_per_day_override?: number;

  @Column({ type: 'integer', nullable: true })
  days_per_week_override?: number;

  @Column({
    type: 'enum',
    enum: ['as_per_company_policy', 'paid', 'unpaid', 'not_applicable'],
    nullable: true
  })
  overtime_policy_override?: string;

  @Column({ type: 'integer', nullable: true })
  weekly_off_days_override?: number;

  @Column({
    type: 'enum',
    enum: ['free', 'paid', 'not_provided'],
    nullable: true
  })
  food_override?: string;

  @Column({
    type: 'enum',
    enum: ['free', 'paid', 'not_provided'],
    nullable: true
  })
  accommodation_override?: string;

  @Column({
    type: 'enum',
    enum: ['free', 'paid', 'not_provided'],
    nullable: true
  })
  transport_override?: string;
}
```

## Other Enums

### Announcement Type
```typescript
@Column({
  type: 'enum',
  enum: ['full_ad', 'short_ad', 'update'],
  default: 'full_ad'
})
announcement_type: string;
```

**Frontend Options**:
- `full_ad` - "Full Advertisement"
- `short_ad` - "Short Advertisement"
- `update` - "Update"

### Experience Level
```typescript
experience_requirements?: {
  min_years?: number;
  max_years?: number;
  level?: 'fresher' | 'experienced' | 'skilled' | 'expert';
}
```

**Frontend Options**:
- `fresher` - "Fresher"
- `experienced` - "Experienced"
- `skilled` - "Skilled"
- `expert` - "Expert"

## Changes Made to Frontend

### Before (WRONG):
```javascript
// Overtime Policy
<option value="paid">Paid</option>
<option value="unpaid">Unpaid</option>
<option value="compensatory">Compensatory Leave</option> // ❌ Invalid

// Food/Accommodation/Transport
<option value="free">Free</option>
<option value="subsidized">Subsidized</option> // ❌ Invalid
<option value="not_provided">Not Provided</option>
```

### After (CORRECT):
```javascript
// Overtime Policy
<option value="as_per_company_policy">As Per Company Policy</option>
<option value="paid">Paid</option>
<option value="unpaid">Unpaid</option>
<option value="not_applicable">Not Applicable</option>

// Food/Accommodation/Transport
<option value="free">Free</option>
<option value="paid">Paid by Worker</option>
<option value="not_provided">Not Provided</option>
```

## Validation Rules (from DTO)

```typescript
@IsOptional()
@IsArray()
@IsString({ each: true })
@ArrayMaxSize(20)
skills?: string[];

@IsOptional()
@IsArray()
@IsString({ each: true })
@ArrayMaxSize(10)
education_requirements?: string[];

@IsOptional()
@IsArray()
@IsString({ each: true })
@ArrayMaxSize(10)
canonical_title_names?: string[];
```

**Limits**:
- Skills: Max 20 items
- Education Requirements: Max 10 items
- Canonical Title Names: Max 10 items

## Summary

✅ **Fixed**: Removed invalid enum values (`subsidized`, `compensatory`)
✅ **Added**: All valid enum values from backend
✅ **Matched**: Frontend now exactly matches backend enum definitions

The form will now submit successfully without enum validation errors!
