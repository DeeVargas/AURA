import tensorflow as tf
import numpy as np

# Dados simples de exemplo (horário → tempo)
X = np.array([6, 9, 12, 15, 18, 21])
y = np.array([20, 30, 45, 60, 80, 100])

model = tf.keras.Sequential([
    tf.keras.layers.Dense(1, input_shape=[1])
])

model.compile(optimizer='adam', loss='mean_squared_error')

model.fit(X, y, epochs=200, verbose=0)

def prever(hora):
    return float(model.predict(np.array([[hora]]))[0][0])