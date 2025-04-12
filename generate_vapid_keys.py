from pywebpush import generate_vapid_keys

def generate_keys():
    vapid_keys = generate_vapid_keys()
    
    public_key = vapid_keys.get('public_key')
    private_key = vapid_keys.get('private_key')
    
    return public_key, private_key

if __name__ == "__main__":
    public_key, private_key = generate_keys()
    print("Public Key:", public_key)
    print("Private Key:", private_key)