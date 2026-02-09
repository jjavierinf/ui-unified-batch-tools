# Saga Hash Integration

## Overview

This document explains the behavior of the `saga_hash` function used in our integration, focusing on how it handles `None` values and empty strings.

### How It Works

The `saga_hash` is generated using the following Python function:

```python
def create_saga_hash(*args):
    import hashlib 
    cleaned_args = [str(arg) if arg is not None else '' for arg in args]
    combined_values = ''.join(map(str, cleaned_args))
    hash_object = hashlib.sha256(combined_values.encode())
    truncated_hash = hash_object.digest()[:7]
    numeric_hash = int.from_bytes(truncated_hash, byteorder='big')
    return numeric_hash
```

### Key Details

- **Handling `None` Values:** 
  - The function converts any `None` values in the input to empty strings (`````).
  - As a result, `None` and an empty string are treated the same way during the hash generation.

- **Hash Generation:**
  - All input values are concatenated into a single string after converting `None` values to empty strings.
  - A SHA-256 hash is generated from this combined string.
  - The hash is then truncated to the first 7 bytes and converted into a numeric value.

### Important Consideration

- **Same Hash for `None` and Empty String:**
  - If an input changes from `None` to an empty string, the `saga_hash` will remain the same. This is because both `None` and empty strings are treated identically by the function.
  - This behavior might lead to situations where different records (one with `None` values and another with empty strings) produce the same `saga_hash`, which could affect the uniqueness of the hash.

### Example

Consider the following example:

```python
# Row 1 with None values
saga_hash_row1 = create_saga_hash(None, "customer123", None, "2024-08-26")

# Row 2 with empty strings instead of None
saga_hash_row2 = create_saga_hash("", "customer123", "", "2024-08-26")

print(f"Hash for row 1: {saga_hash_row1}") # 52797873498845303
print(f"Hash for row 2: {saga_hash_row2}") # 52797873498845303
print(saga_hash_row1 == saga_hash_row2)  # This will output: True
```

In this example, `saga_hash_row1` and `saga_hash_row2` represent the saga hash for rows where some columns might contain `None` values, and others contain empty strings. Since the `saga_hash` function treats `None` as an empty string, both `saga_hash_row1` and `saga_hash_row2` will generate the same hash, even though the original values in the database are different. The script outputs the actual numeric hash values for each row.

